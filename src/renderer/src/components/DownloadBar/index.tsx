import { useMemo } from 'react';
import { FaCheckCircle, FaDownload, FaExclamationCircle, FaFolderOpen, FaPauseCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';

export type DownloadStatus = 'pending' | 'downloading' | 'complete' | 'error' | 'cancelled';

export interface DownloadProgressItem {
    id: string;
    fileName: string;
    progress: number;
    status: DownloadStatus;
    error?: string;
    filePath?: string;
}

interface DownloadBarProps {
    downloads: DownloadProgressItem[];
    onClose: () => void;
    onRemove: (id: string) => void;
    onShowInFolder: (path: string) => void;
}

export default function DownloadBar({ downloads, onClose, onRemove, onShowInFolder }: DownloadBarProps) {
    const uniqueDownloads = useMemo(() => {
        const map = new Map<string, DownloadProgressItem>();

        [...downloads].reverse().forEach((item) => {
            if (!map.has(item.id)) {
                map.set(item.id, item);
            }
        });

        return Array.from(map.values());
    }, [downloads]);

    const allComplete = uniqueDownloads.length > 0 && uniqueDownloads.every((item) => item.status === 'complete');
    const hasIssues = uniqueDownloads.some((item) => item.status === 'error' || item.status === 'cancelled');

    const subtitle = allComplete ? (
        <>
            <FaCheckCircle className='text-green-500 mr-2' /> Downloads concluídos
        </>
    ) : hasIssues ? (
        <>
            <FaExclamationCircle className='text-amber-500 mr-2' /> Downloads com atenção
        </>
    ) : (
        <>
            <FaDownload className='text-blue-500 mr-2' /> Baixando arquivos
        </>
    );

    return (
        <div className='fixed bottom-5 right-10 -translate-x-1/2 z-[1500] w-11/12 max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-fade-up'>
            <div className='flex items-center justify-between mb-3'>
                <h3 className='font-semibold text-lg flex items-center'>{subtitle}</h3>
                <div className='flex items-center gap-2'>
                    {(() => {
                        const target = uniqueDownloads.find((d) => d.filePath && d.status === 'complete') || uniqueDownloads.find((d) => d.filePath);
                        return target ? (
                            <button title='Mostrar na pasta' className='text-blue-600 hover:text-blue-800' onClick={() => onShowInFolder(target.filePath!)}>
                                <FaFolderOpen />
                            </button>
                        ) : null;
                    })()}
                    <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                        <FaTimesCircle size={18} />
                    </button>
                </div>
            </div>

            <div className='max-h-60 overflow-y-auto pr-1'>
                {uniqueDownloads.map((download) => (
                    <div key={download.id} className='mb-2 last:mb-0'>
                        <div className='flex justify-between items-center text-sm mb-1'>
                            <span className='truncate flex-1 pr-2' title={download.fileName}>
                                {download.fileName}
                            </span>
                            <div className='flex items-center gap-3'>
                                <span className='flex items-center text-gray-700'>
                                    {download.status === 'complete' && <FaCheckCircle className='text-green-500 mr-1' />}
                                    {download.status === 'error' && <FaExclamationCircle className='text-red-500 mr-1' />}
                                    {download.status === 'cancelled' && <FaPauseCircle className='text-amber-500 mr-1' />}
                                    {download.progress}%
                                </span>
                                {download.filePath && (
                                    <button title='Mostrar na pasta' className='text-blue-600 hover:text-blue-800' onClick={() => onShowInFolder(download.filePath!)}>
                                        <FaFolderOpen />
                                    </button>
                                )}
                                <button title='Remover da lista' className='text-gray-500 hover:text-gray-700' onClick={() => onRemove(download.id)}>
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                        <div className='h-1.5 w-full bg-gray-200 rounded-full overflow-hidden'>
                            <div
                                className={`h-full rounded-full ${download.status === 'error' ? 'bg-red-500' : download.status === 'complete' ? 'bg-green-500' : download.status === 'cancelled' ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${download.progress}%` }}
                            />
                        </div>
                        {download.status === 'error' && <p className='text-xs text-red-500 mt-0.5'>{download.error || 'Falha no download'}</p>}
                        {download.status === 'cancelled' && <p className='text-xs text-amber-600 mt-0.5'>Download cancelado</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
