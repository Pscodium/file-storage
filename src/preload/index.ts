import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';

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
