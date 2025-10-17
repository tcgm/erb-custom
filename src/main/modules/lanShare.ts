/**
 * LAN Share Module
 * 
 * Peer-to-peer discovery and file transfer over local network.
 * Designed for trusted network environments (home/office LANs).
 * 
 * Features:
 * - UDP broadcast-based peer discovery
 * - HTTP server for file transfers  
 * - Project/folder sharing with compression
 * - Offer/accept workflow for transfers
 * - Display name resolution (Windows/Mac/Linux)
 * - Transfer progress tracking
 * 
 * Security Note:
 * This module is designed for trusted networks. For optional security
 * hardening, see docs/LAN_SHARE_SECURITY.md
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import os from 'os';
import http from 'http';
import dgram from 'dgram';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import archiver from 'archiver';
import extract from 'extract-zip';
import { getDocumentsFolder } from '../helpers/systemPaths';

type PeerInfo = {
  id: string;
  name: string; // display name preferred
  username?: string; // login name
  displayName?: string; // explicit display name
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  version?: string | null;
  addresses: string[];
  httpPort: number;
};

type OfferRequest = {
  sender: PeerInfo;
  projectName: string;
  approxSize?: number;
};

type OfferResponse = {
  accept: boolean;
  receiver: PeerInfo;
  message?: string;
  uploadUrl?: string;
  token?: string;
  destLabel?: string;
};

const DISCOVERY_PORT = 49372; // UDP
const DISCOVERY_MAGIC_REQ = 'ERB_DISCOVER_REQ_V1';
const DISCOVERY_MAGIC_RES = 'ERB_DISCOVER_RES_V1';

let httpServer: http.Server | null = null;
let httpPort: number | null = null;
let udpSocket: dgram.Socket | null = null;
let instanceId = crypto.randomBytes(8).toString('hex');
let displayNameCache: string | null = null;
let activeSends = 0;
let activeReceives = 0;

/**
 * Resolve display name asynchronously on module load
 */
function resolveDisplayNameAsync() {
  const platform = process.platform;
  let cmd: string | null = null;
  let args: string[] = [];
  
  if (platform === 'win32') {
    // PowerShell: Try multiple sources for a friendly display name
    cmd = 'powershell.exe';
    args = [
      '-NoProfile', '-NonInteractive', '-Command',
      `$u = $env:USERNAME; ` +
      `$n = $null; ` +
      `try { $n = (Get-LocalUser -Name $u -ErrorAction SilentlyContinue).FullName } catch {}; ` +
      `if ([string]::IsNullOrWhiteSpace($n)) { try { $n = ([System.DirectoryServices.AccountManagement.UserPrincipal]::Current).DisplayName } catch {} }; ` +
      `if ([string]::IsNullOrWhiteSpace($n)) { try { $n = (Get-CimInstance -ClassName Win32_UserAccount -Filter "Name='$u'").FullName } catch {} }; ` +
      `if ([string]::IsNullOrWhiteSpace($n)) { $n = $u }; ` +
      `$n`
    ];
  } else if (platform === 'darwin') {
    cmd = '/usr/bin/id';
    args = ['-F'];
  } else {
    // Linux: getent passwd $USER | cut -d: -f5
    cmd = '/usr/bin/getent';
    args = ['passwd', process.env.USER || ''];
  }
  
  try {
    const { spawn } = require('child_process');
    const child = spawn(cmd!, args, { windowsHide: true });
    let out = '';
    child.stdout.on('data', (d: any) => { out += String(d || ''); });
    child.on('close', () => {
      try {
        let name = (out || '').trim();
        if (process.platform === 'linux' && name.includes(':')) {
          // parse getent line
          const parts = name.split(':');
          name = parts[4] || (process.env.USER || '');
        }
        const login = process.env.USERNAME || process.env.USER || '';
        displayNameCache = name || login || os.hostname();
      } catch {
        displayNameCache = null;
      }
    });
  } catch {
    /* ignore */
  }
}
resolveDisplayNameAsync();

/**
 * Get list of non-internal IPv4 addresses
 */
function listAddresses(): string[] {
  const ifs = os.networkInterfaces();
  const out: string[] = [];
  for (const key of Object.keys(ifs)) {
    for (const addr of ifs[key] || []) {
      if (!addr.internal && addr.family === 'IPv4') out.push(addr.address);
    }
  }
  return out;
}

/**
 * Get app version string
 */
function getAppVersion(): string | null {
  try {
    return app.getVersion();
  } catch {
    return null;
  }
}

/**
 * Get local peer info based on settings
 */
function getLocalInfo(): PeerInfo {
  const login = os.userInfo()?.username || '';
  const dispResolved = displayNameCache || login || os.hostname();
  
  // Read settings from persisted config
  let broadcastDisplayName = false;
  let broadcastLoginName = false;
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const parsed = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as any;
      if (parsed?.lan) {
        broadcastDisplayName = !!parsed.lan.broadcastDisplayName;
        broadcastLoginName = !!parsed.lan.broadcastLoginName;
      }
    }
  } catch {}
  
  const exposedName = broadcastDisplayName ? dispResolved : os.hostname();
  const exposedUsername = broadcastLoginName ? login : undefined;
  const exposedDisplayName = broadcastDisplayName ? dispResolved : undefined;
  
  return {
    id: instanceId,
    name: exposedName,
    username: exposedUsername,
    displayName: exposedDisplayName,
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    version: getAppVersion(),
    addresses: listAddresses(),
    httpPort: httpPort || 0,
  };
}

/**
 * Ensure directory exists
 */
function ensureDir(p: string) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {}
}

/**
 * Get root folder for received files
 */
function getReceivedRoot(): string {
  const root = path.join(getDocumentsFolder(), app.getName(), 'Shared');
  ensureDir(root);
  return root;
}

/**
 * Sanitize filename for cross-platform compatibility
 */
function sanitize(name: string) {
  return name.replace(/[\/:*?"<>|]+/g, '_').trim();
}

/**
 * Parse JSON body from HTTP request
 */
async function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const buf: Buffer[] = [];
    req.on('data', (d) => { buf.push(Buffer.from(d)); });
    req.on('error', (e) => reject(e));
    req.on('end', () => {
      try {
        const text = Buffer.concat(buf).toString('utf8');
        const json = text ? JSON.parse(text) : {};
        resolve(json);
      } catch (e) {
        reject(e);
      }
    });
  });
}

const pendingUploads = new Map<string, {
  destDir: string;
  createdAt: number;
  projectName: string;
  transferId: string;
}>();

const pendingOffers = new Map<string, (accept: boolean) => void>();

/**
 * Emit offer to renderer for user decision
 */
function emitOfferToRenderer(offerId: string, body: OfferRequest) {
  const wins = BrowserWindow.getAllWindows();
  const payload = {
    offerId,
    sender: body.sender,
    projectName: body.projectName,
    approxSize: body.approxSize,
  };
  for (const w of wins) {
    try {
      w.webContents.send('lan:offer', payload);
    } catch {}
  }
}

/**
 * Wait for user decision on incoming offer
 */
function waitForOfferDecision(
  offerId: string,
  body: OfferRequest,
  timeoutMs = 30000
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    
    pendingOffers.set(offerId, (acc) => {
      try {
        pendingOffers.delete(offerId);
      } catch {}
      done(acc);
    });
    
    emitOfferToRenderer(offerId, body);
    
    setTimeout(() => {
      if (!settled) {
        try {
          pendingOffers.delete(offerId);
        } catch {}
        done(false);
      }
    }, timeoutMs);
  });
}

/**
 * Create HTTP server for peer communication
 */
function createHttpServer() {
  if (httpServer) return;
  
  httpServer = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      
      // GET /lan/info - return peer info
      if (req.method === 'GET' && url.pathname === '/lan/info') {
        const info = getLocalInfo();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(info));
        return;
      }
      
      // POST /lan/offer - receive transfer offer
      if (req.method === 'POST' && url.pathname === '/lan/offer') {
        const body: OfferRequest = await parseJsonBody(req);
        const recvInfo = getLocalInfo();
        const offerId = crypto.randomBytes(8).toString('hex');
        
        // Notify renderer about offer
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'receiver',
              phase: 'offer',
              status: 'prompt',
              projectName: body.projectName,
              peer: body.sender?.addresses?.[0] || body.sender?.hostname || 'peer',
            });
          } catch {}
        }
        
        const accept = await waitForOfferDecision(offerId, body, 60000);
        
        if (!accept) {
          for (const w of BrowserWindow.getAllWindows()) {
            try {
              w.webContents.send('lan:transfer-progress', {
                role: 'receiver',
                phase: 'offer',
                status: 'declined',
                projectName: body.projectName,
                peer: body.sender?.addresses?.[0] || body.sender?.hostname || 'peer',
              });
            } catch {}
          }
          
          const rsp: OfferResponse = {
            accept: false,
            receiver: recvInfo,
            message: 'Declined',
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rsp));
          return;
        }
        
        // Prepare destination folder
        const stamp = new Date();
        const ts =
          `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}` +
          `_${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}${String(stamp.getSeconds()).padStart(2, '0')}`;
        const base = sanitize(body?.projectName || 'Project');
        const destDir = path.join(getReceivedRoot(), `${base}_${ts}`);
        ensureDir(destDir);
        
        const token = crypto.randomBytes(16).toString('hex');
        const receiverTransferId = crypto.randomBytes(6).toString('hex');
        
        pendingUploads.set(token, {
          destDir,
          createdAt: Date.now(),
          projectName: base,
          transferId: receiverTransferId,
        });
        
        const uploadUrl = `/lan/upload?token=${token}`;
        const rsp: OfferResponse = {
          accept: true,
          receiver: recvInfo,
          uploadUrl,
          token,
          destLabel: path.basename(destDir),
        };
        
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'receiver',
              phase: 'offer',
              status: 'accepted',
              projectName: body.projectName,
              peer: body.sender?.addresses?.[0] || body.sender?.hostname || 'peer',
              transferId: receiverTransferId,
            });
          } catch {}
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rsp));
        return;
      }
      
      // POST /lan/upload - receive file upload
      if (req.method === 'POST' && url.pathname === '/lan/upload') {
        const token = url.searchParams.get('token') || '';
        const pending = pendingUploads.get(token);
        
        if (!pending) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid token' }));
          return;
        }
        
        const tmpZip = path.join(pending.destDir, 'incoming.zip');
        const contentLen = parseInt(String(req.headers['content-length'] || '0'), 10) || 0;
        let received = 0;
        const transferId = pending.transferId || crypto.randomBytes(6).toString('hex');
        activeReceives++;
        const peerAddr = (req.socket as any)?.remoteAddress || 'peer';
        
        const emit = (phase: string) => {
          const payload = {
            role: 'receiver',
            phase,
            receivedBytes: received,
            totalBytes: contentLen,
            transferId,
            projectName: pending.projectName,
            peer: peerAddr,
          };
          for (const w of BrowserWindow.getAllWindows()) {
            try {
              w.webContents.send('lan:transfer-progress', payload);
            } catch {}
          }
        };
        
        emit('receiving');
        
        // Save incoming zip
        await new Promise<void>((resolve, reject) => {
          try {
            const ws = fs.createWriteStream(tmpZip);
            req.on('error', (e) => {
              try {
                ws.close();
              } catch {}
              activeReceives = Math.max(0, activeReceives - 1);
              emit('error');
              reject(e);
            });
            req.on('data', (chunk: any) => {
              try {
                received += chunk?.length || 0;
                emit('receiving');
              } catch {}
            });
            ws.on('error', (e) => reject(e));
            ws.on('close', () => resolve());
            req.pipe(ws);
          } catch (e) {
            reject(e as any);
          }
        });
        
        // Extract zip
        try {
          emit('extracting');
          await extract(tmpZip, { dir: pending.destDir });
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              error: 'Extract failed: ' + String((e as any)?.message || e),
            })
          );
          activeReceives = Math.max(0, activeReceives - 1);
          emit('error');
          return;
        } finally {
          try {
            fs.rmSync(tmpZip, { force: true });
          } catch {}
        }
        
        pendingUploads.delete(token);
        
        // Find main files (could be customized for your app)
        const mainFiles: string[] = [];
        try {
          const files = fs.readdirSync(pending.destDir);
          // Example: look for common project files
          const projectExtensions = ['.xml', '.json', '.project'];
          mainFiles.push(
            ...files
              .filter((f) =>
                projectExtensions.some((ext) => f.toLowerCase().endsWith(ext))
              )
              .map((f) => path.join(pending.destDir, f))
          );
        } catch {}
        
        // Notify renderer
        const payload = {
          ok: true,
          projectName: pending.projectName,
          destDir: pending.destDir,
          mainFiles,
        } as any;
        
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:received', payload);
          } catch {}
        }
        
        activeReceives = Math.max(0, activeReceives - 1);
        emit('done');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
        return;
      }
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (e: any) {
      try {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
      } catch {}
    }
  });
  
  httpServer.listen(0, () => {
    const addr = httpServer?.address();
    if (typeof addr === 'object' && addr && 'port' in addr) {
      httpPort = addr.port;
    }
  });
}

/**
 * Create UDP socket for peer discovery
 */
function createUdpSocket() {
  if (udpSocket) return;
  
  try {
    udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true } as any);
  } catch {
    udpSocket = dgram.createSocket('udp4');
  }
  
  udpSocket.on('message', (msg, rinfo) => {
    try {
      const text = msg.toString('utf8');
      if (!text) return;
      
      if (text.startsWith(DISCOVERY_MAGIC_REQ)) {
        // Respond to discovery request
        const info = getLocalInfo();
        const payload = JSON.stringify({ t: DISCOVERY_MAGIC_RES, info });
        udpSocket!.send(Buffer.from(payload, 'utf8'), rinfo.port, rinfo.address);
      } else if (text.startsWith('{')) {
        const data = JSON.parse(text);
        if (data?.t === DISCOVERY_MAGIC_RES && data?.info && data?.info.id !== instanceId) {
          // Forward discovered peer to renderer
          for (const w of BrowserWindow.getAllWindows()) {
            try {
              w.webContents.send('lan:peer', data.info);
            } catch {}
          }
        }
      }
    } catch {}
  });
  
  try {
    udpSocket.bind(DISCOVERY_PORT, () => {
      try {
        udpSocket!.setBroadcast(true);
      } catch {}
    });
  } catch {
    // Binding failed - can still send but won't receive
  }
}

/**
 * Broadcast discovery ping
 */
function broadcastDiscovery() {
  if (!udpSocket) return;
  const payload = Buffer.from(DISCOVERY_MAGIC_REQ, 'utf8');
  try {
    udpSocket.send(payload, 0, payload.length, DISCOVERY_PORT, '255.255.255.255');
  } catch {}
}

/**
 * Zip a folder or file for transfer
 * @param sourcePath - Path to file or folder to zip
 * @param onProgress - Progress callback (bytes written)
 */
async function zipSource(
  sourcePath: string,
  onProgress?: (bytes: number) => void
): Promise<{ zipPath: string; totalBytes: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const baseName = path.basename(sourcePath);
      const tmpDir = path.join(app.getPath('temp'), 'erb-share');
      ensureDir(tmpDir);
      
      const outPath = path.join(
        tmpDir,
        `${sanitize(path.basename(sourcePath, path.extname(sourcePath)))}_${Date.now()}.zip`
      );
      
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      let written = 0;
      
      output.on('close', () => resolve({ zipPath: outPath, totalBytes: written }));
      output.on('error', (e) => reject(e));
      archive.on('warning', (e: any) => {
        if ((e as any).code !== 'ENOENT') reject(e);
      });
      archive.on('error', (e: any) => reject(e));
      archive.on('data', (d: any) => {
        written += (d as any)?.length || 0;
        onProgress?.(written);
      });
      
      archive.pipe(output);
      
      const stat = fs.statSync(sourcePath);
      if (stat.isDirectory()) {
        // Add entire folder
        archive.directory(sourcePath, baseName);
      } else {
        // Add single file
        archive.file(sourcePath, { name: baseName });
      }
      
      await archive.finalize();
    } catch (e) {
      reject(e as any);
    }
  });
}

/**
 * HTTP POST with JSON body
 */
async function httpPostJson(
  host: string,
  port: number,
  pathName: string,
  body: any,
  timeoutMs = 10000
): Promise<any> {
  const payload = Buffer.from(JSON.stringify(body || {}), 'utf8');
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host,
        port,
        path: pathName,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
        },
      },
      (res) => {
        const data: Buffer[] = [];
        res.on('data', (d) => data.push(Buffer.from(d)));
        res.on('end', () => {
          try {
            const text = Buffer.concat(data).toString('utf8');
            resolve(text ? JSON.parse(text) : {});
          } catch {
            resolve({});
          }
        });
      }
    );
    
    req.on('error', (e) => reject(e));
    req.setTimeout(timeoutMs, () => {
      try {
        req.destroy(new Error('Timeout'));
      } catch {}
      reject(new Error('Timeout'));
    });
    req.write(payload);
    req.end();
  });
}

/**
 * HTTP POST with file stream
 */
async function httpPostStream(
  host: string,
  port: number,
  pathName: string,
  filePath: string,
  context?: { projectName?: string; peer?: string },
  providedTransferId?: string
): Promise<{ ok: boolean; status?: number; body?: any; transferId: string }> {
  return new Promise((resolve) => {
    try {
      const stat = fs.statSync(filePath);
      const req = http.request(
        {
          host,
          port,
          path: pathName,
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': stat.size,
          },
        },
        (res) => {
          const data: Buffer[] = [];
          res.on('data', (d) => data.push(Buffer.from(d)));
          res.on('end', () => {
            const text = Buffer.concat(data).toString('utf8');
            try {
              resolve({
                ok: res.statusCode === 200,
                status: res.statusCode || 0,
                body: text ? JSON.parse(text) : {},
                transferId,
              });
            } catch {
              resolve({
                ok: res.statusCode === 200,
                status: res.statusCode || 0,
                transferId,
              });
            }
          });
        }
      );
      
      const transferId = providedTransferId || crypto.randomBytes(6).toString('hex');
      let sent = 0;
      activeSends++;
      
      const emit = (phase: string) => {
        const payload = {
          role: 'sender',
          phase,
          sentBytes: sent,
          totalBytes: stat.size,
          transferId,
          projectName: context?.projectName,
          peer: context?.peer,
        };
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', payload);
          } catch {}
        }
      };
      
      req.on('error', () => {
        activeSends = Math.max(0, activeSends - 1);
        emit('error');
        resolve({ ok: false, status: 0, transferId });
      });
      
      const rs = fs.createReadStream(filePath);
      rs.on('data', (chunk) => {
        sent += chunk?.length || 0;
        emit('uploading');
      });
      rs.on('error', () => {
        /* handled by req error */
      });
      rs.on('end', () => {
        /* finalization handled by server response */
      });
      rs.pipe(req);
    } catch {
      resolve({
        ok: false,
        status: 0,
        transferId: providedTransferId || crypto.randomBytes(6).toString('hex'),
      });
    }
  });
}

/**
 * Register LAN Share IPC handlers
 */
export function registerLanShare() {
  createHttpServer();
  createUdpSocket();
  
  // Start peer discovery scan
  ipcMain.handle('lan:scan-start', async () => {
    for (let i = 0; i < 3; i++) setTimeout(() => broadcastDiscovery(), i * 500);
    return { ok: true };
  });
  
  // Send single discovery ping
  ipcMain.handle('lan:scan-ping', async () => {
    broadcastDiscovery();
    return { ok: true };
  });
  
  // Reply to incoming offer
  ipcMain.handle(
    'lan:offer-reply',
    async (_e, data: { offerId: string; accept: boolean }) => {
      const fn = pendingOffers.get(data?.offerId);
      if (fn) {
        try {
          fn(!!data.accept);
        } catch {}
        return { ok: true };
      }
      return { ok: false, error: 'Offer not found' };
    }
  );
  
  // Share file/folder with peer
  ipcMain.handle(
    'lan:share',
    async (
      _e,
      args: { host: string; port: number; sourcePath: string; projectName?: string }
    ) => {
      try {
        const info = getLocalInfo();
        const offer: OfferRequest = {
          sender: info,
          projectName:
            args.projectName ||
            path.basename(args.sourcePath, path.extname(args.sourcePath)),
        };
        const peerLabel = `${args.host}:${args.port}`;
        const transferId = crypto.randomBytes(6).toString('hex');
        
        // Notify renderer: offer pending
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'sender',
              phase: 'offer',
              status: 'pending',
              projectName: offer.projectName,
              peer: peerLabel,
              transferId,
            });
          } catch {}
        }
        
        const resOffer: OfferResponse = await httpPostJson(
          args.host,
          args.port,
          '/lan/offer',
          offer
        );
        
        if (!resOffer?.accept || !resOffer?.uploadUrl) {
          for (const w of BrowserWindow.getAllWindows()) {
            try {
              w.webContents.send('lan:transfer-progress', {
                role: 'sender',
                phase: 'offer',
                status: 'declined',
                projectName: offer.projectName,
                peer: peerLabel,
                transferId,
              });
            } catch {}
          }
          return { ok: false, declined: true, responder: resOffer?.receiver };
        }
        
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'sender',
              phase: 'offer',
              status: 'accepted',
              projectName: offer.projectName,
              peer: peerLabel,
              transferId,
            });
          } catch {}
        }
        
        // Prepare zip
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:share-status', { phase: 'zipping', percent: 0 });
          } catch {}
        }
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'sender',
              phase: 'zipping',
              projectName: offer.projectName,
              peer: peerLabel,
              transferId,
            });
          } catch {}
        }
        
        const { zipPath } = await zipSource(args.sourcePath);
        
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:share-status', { phase: 'uploading', percent: 0 });
          } catch {}
        }
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'sender',
              phase: 'uploading',
              projectName: offer.projectName,
              peer: peerLabel,
              transferId,
            });
          } catch {}
        }
        
        const up = await httpPostStream(
          args.host,
          args.port,
          resOffer.uploadUrl!,
          zipPath,
          { projectName: offer.projectName, peer: peerLabel },
          transferId
        );
        
        try {
          fs.rmSync(zipPath, { force: true });
        } catch {}
        
        if (!up.ok) {
          activeSends = Math.max(0, activeSends - 1);
          for (const w of BrowserWindow.getAllWindows()) {
            try {
              w.webContents.send('lan:transfer-progress', {
                role: 'sender',
                phase: 'error',
                projectName: offer.projectName,
                peer: peerLabel,
                transferId,
              });
            } catch {}
          }
          return {
            ok: false,
            error: 'Upload failed',
            status: up.status,
            responder: resOffer.receiver,
          };
        }
        
        activeSends = Math.max(0, activeSends - 1);
        for (const w of BrowserWindow.getAllWindows()) {
          try {
            w.webContents.send('lan:transfer-progress', {
              role: 'sender',
              phase: 'done',
              projectName: offer.projectName,
              peer: peerLabel,
              transferId,
            });
          } catch {}
        }
        
        return { ok: true, responder: resOffer.receiver, received: up.body };
      } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
      }
    }
  );
  
  // Get transfer statistics
  ipcMain.handle('lan:transfers', () => ({
    sends: activeSends,
    receives: activeReceives,
  }));
}
