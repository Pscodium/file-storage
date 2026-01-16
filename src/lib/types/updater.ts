export interface UpdateInfo {
    version: string;
    releaseDate?: string;
    releaseNotes?: string;
    releaseName?: string;
    releaseNotesFile?: string;
}

export interface DownloadProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}

export interface UpdateCheckResult {
    success: boolean;
    updateInfo?: UpdateInfo;
    error?: string;
}

export interface UpdateDownloadResult {
    success: boolean;
    error?: string;
}
