/**
 * Custom Stream Protocol Module
 * 
 * Registers custom URL protocols for streaming files directly in Electron.
 * Useful for bypassing file:// restrictions and handling large files with range requests.
 * 
 * Default protocol: filestream://
 * Supports: Range requests, UNC paths, proper MIME types
 */

import { protocol, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

// MIME type mappings
const MIME_TYPES: Record<string, string> = {
  // Audio
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  weba: 'audio/webm',
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  // Documents
  pdf: 'application/pdf',
  json: 'application/json',
  xml: 'application/xml',
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
};

/**
 * Get MIME type for file extension
 */
function getMimeType(ext: string): string {
  const clean = ext.toLowerCase().replace('.', '');
  return MIME_TYPES[clean] || 'application/octet-stream';
}

/**
 * Register protocol privileges before app ready
 * Must be called BEFORE app.whenReady()
 */
export function registerStreamProtocolPrivileges(protocolName = 'filestream') {
  try {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: protocolName,
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          stream: true,
        },
      },
    ]);
  } catch (e) {
    console.error('[customStreamProtocol] registerSchemesAsPrivileged failed:', e);
  }
}

/**
 * Register stream protocol handler
 * Must be called AFTER app.whenReady()
 */
export function registerStreamProtocol(protocolName = 'filestream') {
  try {
    protocol.registerStreamProtocol(protocolName, (request, callback) => {
      try {
        // Extract and decode path from URL
        let raw = request.url.replace(new RegExp(`^${protocolName}://`, 'i'), '');
        raw = decodeURIComponent(raw);
        
        // Normalize path
        // UNC paths stay with backslashes; otherwise convert forward slashes
        let localPath = raw;
        if (!raw.startsWith('\\\\')) {
          localPath = raw.replace(/\//g, path.sep);
        }
        
        // Strip any sneaky file:// prefix
        if (/^file:/i.test(localPath)) {
          localPath = localPath.replace(/^file:\/*/, '');
        }
        
        // Check file exists
        if (!fs.existsSync(localPath)) {
          callback({ statusCode: 404 });
          return;
        }
        
        const stat = fs.statSync(localPath);
        const rangeHeader = (request.headers.Range || request.headers.range) as
          | string
          | undefined;
        const ext = path.extname(localPath);
        const mime = getMimeType(ext);
        
        // Handle range requests (for seeking in media files)
        if (rangeHeader) {
          const match = /bytes=([0-9]*)-([0-9]*)/.exec(rangeHeader);
          let start = 0;
          let end = stat.size - 1;
          
          if (match) {
            if (match[1]) start = parseInt(match[1], 10);
            if (match[2]) end = parseInt(match[2], 10);
            if (isNaN(start) || start < 0) start = 0;
            if (isNaN(end) || end >= stat.size) end = stat.size - 1;
            if (end < start) end = start;
          }
          
          const chunkSize = end - start + 1;
          const rs = fs.createReadStream(localPath, { start, end });
          
          // Optional: notify renderer about first chunk (for debugging/analytics)
          try {
            const win = BrowserWindow.getAllWindows()[0];
            if (win) {
              let sent = false;
              rs.on('data', (c) => {
                if (!sent) {
                  sent = true;
                  try {
                    win.webContents.send('filestream:first-chunk', {
                      path: localPath,
                      size: c.length,
                      range: { start, end },
                    });
                  } catch {}
                }
              });
            }
          } catch {}
          
          callback({
            statusCode: 206,
            headers: {
              'Content-Type': mime,
              'Accept-Ranges': 'bytes',
              'Content-Range': `bytes ${start}-${end}/${stat.size}`,
              'Content-Length': String(chunkSize),
            },
            data: rs,
          });
        } else {
          // Full file request
          const rs = fs.createReadStream(localPath);
          
          // Optional: notify renderer about first chunk
          try {
            const win = BrowserWindow.getAllWindows()[0];
            if (win) {
              let sent = false;
              rs.on('data', (c) => {
                if (!sent) {
                  sent = true;
                  try {
                    win.webContents.send('filestream:first-chunk', {
                      path: localPath,
                      size: c.length,
                    });
                  } catch {}
                }
              });
            }
          } catch {}
          
          callback({
            statusCode: 200,
            headers: {
              'Content-Type': mime,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(stat.size),
            },
            data: rs,
          });
        }
      } catch (e) {
        console.error('[customStreamProtocol] error:', e);
        callback({ statusCode: 500 });
      }
    });
  } catch (e) {
    console.error('[customStreamProtocol] registerStreamProtocol failed:', e);
  }
}

/**
 * All-in-one helper: register protocol privileges (call before app.ready)
 * For backward compatibility with original protocols module
 */
export function registerSchemePrivileges(protocolName = 'filestream') {
  registerStreamProtocolPrivileges(protocolName);
}

/**
 * All-in-one helper: register stream protocols (call after app.ready)
 * For backward compatibility with original protocols module
 */
export function registerStreamProtocols(protocolName = 'filestream') {
  registerStreamProtocol(protocolName);
}

export default {
  registerSchemePrivileges,
  registerStreamProtocols,
  registerStreamProtocolPrivileges,
  registerStreamProtocol,
};
