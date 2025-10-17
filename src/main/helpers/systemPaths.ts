/**
 * System Paths Helper
 * 
 * Cross-platform utilities for accessing common system directories.
 * Provides reliable access to user folders across Windows, macOS, and Linux.
 */

import path from 'path';
import os from 'os';
import fs from 'fs';
import { app } from 'electron';

/**
 * Get paths to legacy application folders (if they exist)
 */
function getLegacyFolders(baseFolder: string, folderNames: string[]): string[] {
  return folderNames
    .map((folderName) => path.join(baseFolder, folderName))
    .filter((folderPath) => fs.existsSync(folderPath));
}

/**
 * Fallback method for getting Documents folder
 */
function fallbackDocuments(): string {
  return path.join(os.homedir(), 'Documents');
}

/**
 * Get the user's Documents folder path
 * Respects environment variable overrides for testing/customization
 */
export function getDocumentsFolder(): string {
  const overridePath = process.env.DOCUMENTS_FOLDER_OVERRIDE;
  if (overridePath) {
    return overridePath;
  }

  try {
    // Prefer Electron API which avoids spawning shells and respects OS conventions
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('documents');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // ignore and use fallback
  }
  return fallbackDocuments();
}

/**
 * Get the user's Desktop folder path
 */
export function getDesktopFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('desktop');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), 'Desktop');
}

/**
 * Get the user's Downloads folder path
 */
export function getDownloadsFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('downloads');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), 'Downloads');
}

/**
 * Get the user's Pictures folder path
 */
export function getPicturesFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('pictures');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), 'Pictures');
}

/**
 * Get the user's Music folder path
 */
export function getMusicFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('music');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), 'Music');
}

/**
 * Get the user's Videos folder path
 */
export function getVideosFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      const p = app.getPath('videos');
      if (p && typeof p === 'string') return p;
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), 'Videos');
}

/**
 * Get the application's user data directory
 * This is where app-specific files should be stored
 */
export function getAppDataFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData');
    }
  } catch {
    // fallback
  }
  return path.join(os.homedir(), '.config', app?.getName() || 'electron-app');
}

/**
 * Get the temp directory
 */
export function getTempFolder(): string {
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('temp');
    }
  } catch {
    // fallback
  }
  return os.tmpdir();
}

/**
 * Get list of legacy application folders that exist
 * Useful for migration scenarios
 * 
 * @param baseFolder - The base folder to check for legacy folders
 * @param folderNames - Array of legacy folder names to check
 */
export function getLegacyFoldersList(baseFolder?: string, folderNames?: string[]): string[] {
  const base = baseFolder || path.join(getDocumentsFolder(), 'Harmony System');
  const names = folderNames || ['Composer', 'Archimedes'];
  return getLegacyFolders(base, names);
}

/**
 * Get all common system paths in one object
 * Useful for sending to renderer process
 */
export function getAllSystemPaths() {
  return {
    documents: getDocumentsFolder(),
    desktop: getDesktopFolder(),
    downloads: getDownloadsFolder(),
    pictures: getPicturesFolder(),
    music: getMusicFolder(),
    videos: getVideosFolder(),
    appData: getAppDataFolder(),
    temp: getTempFolder(),
    home: os.homedir(),
  };
}
