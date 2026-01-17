import { ElectronAPI } from '@electron-toolkit/preload';

interface UpdateInfo {
    version: string;
    releaseDate?: string;
    releaseNotes?: string;
    releaseName?: string;
    releaseNotesFile?: string;
}

interface DownloadProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}

interface UpdateCheckResult {
    success: boolean;
    updateInfo?: UpdateInfo;
    error?: string;
}

interface UpdateDownloadResult {
    success: boolean;
    error?: string;
}

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
            // Auto Updater APIs
            checkForUpdates: () => Promise<UpdateCheckResult>;
            downloadUpdate: () => Promise<UpdateDownloadResult>;
            installUpdate: () => void;
            onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void;
            onUpdateDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
            onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => () => void;
            onUpdateError: (callback: (error: string) => void) => () => void;
            // App Info APIs
            getAppInfo: () => Promise<{ name: string; version: string; author: string; description: string }>;
            getChangelogs: () => Promise<Array<{ version: string; date: string; changes: string[] }>>;
        };
    }
}
