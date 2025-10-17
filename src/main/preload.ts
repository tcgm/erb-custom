// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  // Module status APIs
  modules: {
    // Check if file operations module is available
    checkFileOperations: () => ipcRenderer.invoke('system:getPaths').then(() => true).catch(() => false),
    // Check if LAN share module is available
    checkLanShare: () => ipcRenderer.invoke('lan:transfers').then(() => true).catch(() => false),
    // Check if custom stream protocol is available
    checkStreamProtocol: () => Promise.resolve(true), // Protocol is registered at startup
    // Get LAN transfer stats
    getLanStats: () => ipcRenderer.invoke('lan:transfers'),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
