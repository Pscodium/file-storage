/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import DownloadBar, { DownloadProgressItem } from '@renderer/components/DownloadBar';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@renderer/components/ui/dialog';
import { useAuth } from '@renderer/contexts/auth';
import React, { useEffect, useState } from 'react';
import { FaCheck, FaCopy, FaDownload, FaSquareCheck, FaTrashCan } from 'react-icons/fa6';
import AudioPlayer from '../player/audio';
import VideoPlayer from '../player/video';

interface LocalSaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}

interface LocalFileSystemWritableFileStream {
    write(data: BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
}

interface LocalFileSystemFileHandle {
    createWritable: () => Promise<LocalFileSystemWritableFileStream>;
}

type LocalShowSaveFilePicker = (options?: LocalSaveFilePickerOptions) => Promise<LocalFileSystemFileHandle>;

export interface ContentDialogProps {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOpen: boolean;
    file: IFile | undefined;
    folder: IFolder | undefined;
    deleteFile: () => void;
}

export default function ContentDialog({ isOpen, setOpen, file, folder, deleteFile }: ContentDialogProps) {
    const [successCopy, setSuccessCopy] = useState(false);
    const { user } = useAuth();
    const [confirming, setConfirming] = useState(false);
    const [timer, setTimer] = useState<null | number>(null);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [downloads, setDownloads] = useState<DownloadProgressItem[]>([]);
    const [downloadVisible, setDownloadVisible] = useState(false);

    useEffect(() => {
        let countdown: NodeJS.Timeout;
        if (confirming && timer) {
            countdown = setTimeout(() => {
                setConfirming(false);
                clearTimeout(timer);
                setTimer(null);
            }, 3000);
        }
        return () => clearTimeout(countdown);
    }, [confirming, timer]);

    useEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight);
        }
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDeleteClick = () => {
        if (confirming) {
            deleteFile();
            setConfirming(false);
            clearTimeout(timer ? timer : undefined);
            setTimer(null);
        } else {
            setConfirming(true);
            setTimer(Date.now());
        }
    };

    function copyToClipboard() {
        if (!file?.url) return;
        navigator.clipboard.writeText(file.url);
        setSuccessCopy(true);

        setTimeout(() => {
            setSuccessCopy(false);
        }, 1000);
    }

    function updateDownload(downloadId: string, updater: (item: DownloadProgressItem) => DownloadProgressItem) {
        setDownloads((prev) => prev.map((item) => (item.id === downloadId ? updater(item) : item)));
    }

    function getFileTypeOptions(currentFile: IFile | undefined): LocalSaveFilePickerOptions['types'] | undefined {
        if (!currentFile?.type) return undefined;
        const extension = currentFile.name.includes('.') ? currentFile.name.substring(currentFile.name.lastIndexOf('.')) : '';
        return [
            {
                description: 'Arquivo',
                accept: {
                    [currentFile.type]: extension ? [extension] : [],
                },
            },
        ];
    }

    async function streamDownload(url: string, fileHandle: LocalFileSystemFileHandle, downloadId: string) {
        updateDownload(downloadId, (item) => ({ ...item, status: 'downloading', progress: 0 }));

        const writable = await fileHandle.createWritable();
        const response = await fetch(url);

        if (!response.ok) {
            await writable.close();
            throw new Error('Falha ao baixar o arquivo');
        }

        const totalBytes = Number(response.headers.get('content-length')) || 0;
        const reader = response.body?.getReader();

        if (!reader) {
            const blob = await response.blob();
            await writable.write(blob);
            await writable.close();
            updateDownload(downloadId, (item) => ({ ...item, status: 'complete', progress: 100 }));
            return;
        }

        let receivedBytes = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                await writable.write(value);
                receivedBytes += value.length;

                updateDownload(downloadId, (item) => {
                    const percentage = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : Math.min(95, item.progress + 5);
                    return { ...item, progress: percentage, status: 'downloading' };
                });
            }

            await writable.close();
            updateDownload(downloadId, (item) => ({ ...item, status: 'complete', progress: 100 }));
        } catch (error) {
            await writable.close();
            throw error;
        }
    }

    function triggerAnchorDownload(downloadId: string) {
        if (!file?.url) return;
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        updateDownload(downloadId, (item) => ({ ...item, status: 'complete', progress: 100 }));
    }

    async function downloadFile() {
        if (!file?.url || !file.name) return;

        const downloadId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setDownloads((prev) => [...prev, { id: downloadId, fileName: file.name, progress: 0, status: 'pending' }]);
        setDownloadVisible(true);

        // Prefer Electron dialog to get a path and enable "mostrar na pasta"
        const selectPath = (window as Window & { api?: any }).api?.selectSavePath;
        const startDownload = (window as Window & { api?: any }).api?.startDownload;
        const onProgress = (window as Window & { api?: any }).api?.onDownloadProgress;
        const onComplete = (window as Window & { api?: any }).api?.onDownloadComplete;
        const onError = (window as Window & { api?: any }).api?.onDownloadError;

        if (selectPath && startDownload && onProgress && onComplete && onError) {
            try {
                const filePath: string | null = await selectPath(file.name);
                if (!filePath) {
                    updateDownload(downloadId, (item) => ({ ...item, status: 'cancelled' }));
                    return;
                }

                updateDownload(downloadId, (item) => ({ ...item, status: 'downloading', progress: 0, filePath }));

                const unsubProgress = onProgress(({ id, progress }: { id: string; progress: number }) => {
                    if (id === downloadId) updateDownload(downloadId, (item) => ({ ...item, progress, status: 'downloading' }));
                });
                const unsubComplete = onComplete(({ id, filePath: completedPath }: { id: string; filePath: string }) => {
                    if (id === downloadId) updateDownload(downloadId, (item) => ({ ...item, status: 'complete', progress: 100, filePath: completedPath }));
                });
                const unsubError = onError(({ id, error }: { id: string; error: string }) => {
                    if (id === downloadId) updateDownload(downloadId, (item) => ({ ...item, status: 'error', error }));
                });

                await startDownload({ id: downloadId, url: file.url, filePath });
                setOpen(false);

                // Small cleanup timeout to avoid removing listeners too early
                setTimeout(() => {
                    unsubProgress?.();
                    unsubComplete?.();
                    unsubError?.();
                }, 5000);
            } catch (error) {
                const err = error as Error;
                updateDownload(downloadId, (item) => ({ ...item, status: 'error', error: err?.message || 'Erro ao baixar' }));
            }
            return;
        }

        // Fallback to browser picker
        const savePicker = (window as Window & { showSaveFilePicker?: LocalShowSaveFilePicker }).showSaveFilePicker;
        if (!savePicker) {
            triggerAnchorDownload(downloadId);
            return;
        }
        try {
            const fileHandle = await savePicker({ suggestedName: file.name, types: getFileTypeOptions(file) });
            await streamDownload(file.url, fileHandle, downloadId);
            setOpen(false);
        } catch (error) {
            const err = error as Error;
            const isCancelled = err?.name === 'AbortError';
            updateDownload(downloadId, (item) => ({
                ...item,
                status: isCancelled ? 'cancelled' : 'error',
                error: isCancelled ? 'Ação cancelada pelo usuário' : err?.message || 'Erro ao baixar',
                progress: isCancelled ? item.progress : item.progress || 0,
            }));
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setOpen}>
                <DialogContent
                    className='bg-white outline-none border border-gray-100 shadow-2xl z-[1200] flex flex-col overflow-hidden w-[min(96vw,1100px)] max-w-[1100px] p-4 sm:p-6'
                    style={{ maxHeight: Math.max(360, windowHeight - 80) }}
                >
                    <DialogTitle className='text-[24px] text-black'>File</DialogTitle>
                    <DialogDescription className='truncate'>{file?.name}</DialogDescription>
                    <div className='flex w-full flex-col gap-3 overflow-y-auto pb-1'>
                        {folder && file && folder.type === 'video/*' && <VideoPlayer url={file.url} />}
                        {folder && file && folder.type === 'image/*' && <img src={file.url} className='w-full rounded-md object-contain' />}
                        {folder && file && folder.type === 'audio/*' && <AudioPlayer url={file.url} className='w-full' />}
                        {folder && file && !folder.type && <img src={file.url} className='w-full rounded-md object-contain' />}
                    </div>
                    <div className='w-full flex justify-between pt-2'>
                        <div className='flex items-center gap-3'>
                            <div onClick={copyToClipboard} className='cursor-pointer'>
                                {successCopy ? <FaCheck className='fill-gray-500' /> : <FaCopy className='fill-gray-500' />}
                            </div>
                            <div onClick={downloadFile} className='cursor-pointer'>
                                <FaDownload className='fill-blue-500' />
                            </div>
                        </div>

                        {user?.role == 'owner' && (
                            <button className='self-center' onClick={handleDeleteClick}>
                                {confirming ? <FaSquareCheck color='#ffcc00' className='h-4 w-4' /> : <FaTrashCan color='#FF3366' className='h-4 w-4' />}
                            </button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {downloadVisible && downloads.length > 0 && (
                <DownloadBar
                    downloads={downloads}
                    onClose={() => setDownloadVisible(false)}
                    onRemove={(id) => setDownloads((prev) => prev.filter((d) => d.id !== id))}
                    onShowInFolder={(path) => {
                        const showFn = (window as Window & { api?: any }).api?.showInFolder;
                        if (path && showFn) showFn(path);
                    }}
                />
            )}
        </>
    );
}
