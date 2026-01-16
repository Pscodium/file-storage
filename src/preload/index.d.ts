import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
    interface Window {
        electron: ElectronAPI;
        api: {
            selectSavePath: (suggestedName?: string) => Promise<string | null>;
            startDownload: (payload: { id: string; url: string; filePath: string }) => Promise<boolean>;
            onDownloadProgress: (callback: (data: { id: string; progress: number }) => void) => () => void;
            onDownloadComplete: (callback: (data: { id: string; filePath: string }) => void) => () => void;
            onDownloadError: (callback: (data: { id: string; error: string }) => void) => () => void;
            showInFolder: (filePath: string) => Promise<boolean>;
        };
    }
}
