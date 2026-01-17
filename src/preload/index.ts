import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';
import { DownloadProgress, UpdateCheckResult, UpdateDownloadResult, UpdateInfo } from './updater.types';

// Custom APIs for renderer
const api = {
    selectSavePath: (suggestedName?: string) => ipcRenderer.invoke('select-save-path', { suggestedName }) as Promise<string | null>,
    startDownload: (payload: { id: string; url: string; filePath: string }) => ipcRenderer.invoke('start-download', payload) as Promise<boolean>,
    onDownloadProgress: (callback: (data: { id: string; progress: number }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: { id: string; progress: number }) => callback(data);
        ipcRenderer.on('download-progress', handler);
        return () => ipcRenderer.removeListener('download-progress', handler);
    },
    onDownloadComplete: (callback: (data: { id: string; filePath: string }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: { id: string; filePath: string }) => callback(data);
        ipcRenderer.on('download-complete', handler);
        return () => ipcRenderer.removeListener('download-complete', handler);
    },
    onDownloadError: (callback: (data: { id: string; error: string }) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: { id: string; error: string }) => callback(data);
        ipcRenderer.on('download-error', handler);
        return () => ipcRenderer.removeListener('download-error', handler);
    },
    showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', { filePath }) as Promise<boolean>,
    // Auto Updater APIs
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates') as Promise<UpdateCheckResult>,
    downloadUpdate: () => ipcRenderer.invoke('download-update') as Promise<UpdateDownloadResult>,
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
        ipcRenderer.on('update-available', handler);
        return () => ipcRenderer.removeListener('update-available', handler);
    },
    onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress);
        ipcRenderer.on('update-download-progress', handler);
        return () => ipcRenderer.removeListener('update-download-progress', handler);
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo) => callback(info);
        ipcRenderer.on('update-downloaded', handler);
        return () => ipcRenderer.removeListener('update-downloaded', handler);
    },
    onUpdateError: (callback: (error: string) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
        ipcRenderer.on('update-error', handler);
        return () => ipcRenderer.removeListener('update-error', handler);
    },
    // External links
    openExternal: (url: string) => ipcRenderer.invoke('open-external', { url }) as Promise<boolean>,
    // App Info APIs
    getAppInfo: () => ipcRenderer.invoke('get-app-info') as Promise<{ name: string; version: string; author: string; description: string }>,
    getChangelogs: () => ipcRenderer.invoke('get-changelogs') as Promise<Array<{ version: string; date: string; changes: string[] }>>,
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            controlWindow: (action) => ipcRenderer.send('window-control', action),
        });
        contextBridge.exposeInMainWorld('api', api);
    } catch (error) {
        console.error(error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
