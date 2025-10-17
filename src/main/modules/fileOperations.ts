/**
 * File Operations Module
 * 
 * Generic file and folder operations for Electron apps.
 * Provides safe, memory-efficient file handling with progress tracking.
 */

import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { getDocumentsFolder, getAllSystemPaths } from '../helpers/systemPaths';

/**
 * Register all file operation IPC handlers
 */
export function registerFileOperations() {
  // Dialog: open file
  ipcMain.handle('dialog:openFile', async (_event, options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: ('openFile' | 'openDirectory' | 'multiSelections')[];
  }) => {
    const result = await dialog.showOpenDialog({
      defaultPath: options?.defaultPath,
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: options?.properties || ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Dialog: open multiple files
  ipcMain.handle('dialog:openFiles', async (_event, options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }) => {
    const result = await dialog.showOpenDialog({
      defaultPath: options?.defaultPath,
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections'],
    });
    return result.canceled ? [] : result.filePaths;
  });

  // Dialog: open folder
  ipcMain.handle('dialog:openFolder', async (_event, defaultPath?: string) => {
    const result = await dialog.showOpenDialog({
      defaultPath,
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Dialog: save file
  ipcMain.handle('dialog:saveFile', async (_event, defaultPath?: string, filters?: { name: string; extensions: string[] }[]) => {
    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    return { success: !result.canceled, path: result.filePath };
  });

  // Copy file with new name dialog (Save As)
  ipcMain.handle('file:copyAs', async (_event, sourcePath: string) => {
    try {
      if (!sourcePath) return { error: 'No source path provided' };
      if (!fs.existsSync(sourcePath)) return { error: 'Source file does not exist' };
      
      const dir = path.dirname(sourcePath);
      const ext = path.extname(sourcePath) || '';
      const base = path.basename(sourcePath, ext);
      const suggested = path.join(dir, `${base} Copy${ext}`);
      
      const result = await dialog.showSaveDialog({
        defaultPath: suggested,
        filters: ext ? [{ name: ext.slice(1).toUpperCase(), extensions: [ext.slice(1)] }] : undefined,
      });
      
      if (result.canceled || !result.filePath) return { cancelled: true };
      
      const dest = result.filePath;
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      
      fs.copyFileSync(sourcePath, dest);
      return { success: true, path: dest };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Read text file with size limits
  ipcMain.handle('file:readText', async (_event, fullPath: string, maxSize?: number) => {
    try {
      if (!fullPath) throw new Error('No path provided');
      if (!fs.existsSync(fullPath)) throw new Error('File does not exist');
      
      const MAX = maxSize || 512 * 1024; // Default 512 KB
      const stat = fs.statSync(fullPath);
      
      if (stat.size > MAX) {
        const buffer = Buffer.allocUnsafe(MAX);
        const fd = fs.openSync(fullPath, 'r');
        try {
          fs.readSync(fd, buffer, 0, MAX, 0);
        } finally {
          fs.closeSync(fd);
        }
        return { truncated: true, content: buffer.toString('utf-8'), size: stat.size };
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { truncated: false, content, size: stat.size };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Write text file
  ipcMain.handle('file:writeText', async (_event, fullPath: string, content: string) => {
    try {
      if (!fullPath) throw new Error('No path provided');
      
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Get file metadata
  ipcMain.handle('file:metadata', async (_event, targetPath: string) => {
    try {
      if (!targetPath || !fs.existsSync(targetPath)) return { exists: false };
      
      const st = fs.statSync(targetPath);
      return {
        exists: true,
        size: st.size,
        mtime: st.mtimeMs,
        isFile: st.isFile(),
        isDirectory: st.isDirectory(),
      };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Probe file (fast read first 8KB)
  ipcMain.handle('file:probe', async (_event, fullPath: string) => {
    const start = Date.now();
    try {
      if (!fullPath) throw new Error('No path');
      const fd = fs.openSync(fullPath, 'r');
      try {
        const buf = Buffer.allocUnsafe(8192);
        const bytes = fs.readSync(fd, buf, 0, 8192, 0);
        const elapsed = Date.now() - start;
        return { ok: true, bytes, elapsed };
      } finally {
        fs.closeSync(fd);
      }
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e), elapsed: Date.now() - start };
    }
  });

  // Read binary file (with size limit for safety)
  ipcMain.handle('file:readBinary', async (_event, fullPath: string, maxSize?: number) => {
    try {
      if (!fullPath || !fs.existsSync(fullPath)) throw new Error('File not found');
      
      const stat = fs.statSync(fullPath);
      const MAX = maxSize || 64 * 1024 * 1024; // Default 64MB
      
      if (stat.size > MAX) {
        return { error: `File too large (>${Math.round(MAX / 1024 / 1024)}MB limit)` };
      }
      
      const buf = fs.readFileSync(fullPath);
      const b64 = buf.toString('base64');
      return { success: true, data: b64, size: stat.size };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Cache file to app data directory
  ipcMain.handle('file:cache', async (_event, sourcePath: string, cacheSubdir?: string) => {
    try {
      if (!sourcePath) throw new Error('No source path');
      if (!fs.existsSync(sourcePath)) throw new Error('Source not found');
      
      const stat = fs.statSync(sourcePath);
      const userData = app.getPath('userData');
      const cacheDir = path.join(userData, cacheSubdir || 'file-cache');
      
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      const base = path.basename(sourcePath);
      const hash = createHash('md5')
        .update(sourcePath + '|' + stat.mtimeMs + '|' + stat.size)
        .digest('hex')
        .slice(0, 12);
      const dest = path.join(cacheDir, `${hash}_${base}`);
      
      // Check if already cached
      if (fs.existsSync(dest) && fs.statSync(dest).size === stat.size) {
        return { success: true, dest, reused: true, size: stat.size };
      }
      
      // Copy with progress
      await new Promise<void>((resolve, reject) => {
        const rs = fs.createReadStream(sourcePath);
        const ws = fs.createWriteStream(dest);
        let copied = 0;
        
        rs.on('data', (chunk) => {
          copied += chunk.length;
          try {
            const win = BrowserWindow.getAllWindows()[0];
            if (win) {
              win.webContents.send('file:cache-progress', {
                source: sourcePath,
                dest,
                copied,
                total: stat.size,
              });
            }
          } catch {}
        });
        
        rs.on('error', (e) => {
          try { fs.unlinkSync(dest); } catch {}
          reject(e);
        });
        
        ws.on('error', (e) => {
          try { fs.unlinkSync(dest); } catch {}
          reject(e);
        });
        
        ws.on('close', () => resolve());
        rs.pipe(ws);
      });
      
      return { success: true, dest, reused: false, size: stat.size };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Delete file
  ipcMain.handle('file:delete', async (_event, fullPath: string) => {
    try {
      if (!fullPath || !fs.existsSync(fullPath)) {
        return { error: 'File not found' };
      }
      fs.unlinkSync(fullPath);
      return { success: true };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  });

  // Check if file exists
  ipcMain.handle('file:exists', async (_event, fullPath: string) => {
    try {
      return { exists: fullPath && fs.existsSync(fullPath) };
    } catch {
      return { exists: false };
    }
  });

  // Get system paths
  ipcMain.handle('system:getPaths', async () => {
    return getAllSystemPaths();
  });

  // Get documents folder
  ipcMain.handle('system:getDocumentsFolder', async () => {
    return getDocumentsFolder();
  });
}
