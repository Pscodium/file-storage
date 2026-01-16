import { FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';
import { useMemo } from 'react';

export interface FileUploadProgress {
    fileId: string;
    fileName: string;
    progress: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
    index: number;
    total: number;
}

interface UploadProgressProps {
    files: FileUploadProgress[];
    onClose: () => void;
}

export default function UploadProgress({ files, onClose }: UploadProgressProps) {
    const uniqueFiles = useMemo(() => {
        const fileMap = new Map();

        [...files].reverse().forEach((file) => {
            if (!fileMap.has(file.fileId)) {
                fileMap.set(file.fileId, file);
            }
        });

        return Array.from(fileMap.values());
    }, [files]);

    const allComplete = uniqueFiles.every((file) => file.status === 'complete');
    const hasErrors = uniqueFiles.some((file) => file.status === 'error');

    const overallProgress = useMemo(() => {
        return uniqueFiles.length > 0 ? Math.round(uniqueFiles.reduce((acc, file) => acc + file.progress, 0) / uniqueFiles.length) : 0;
    }, [uniqueFiles]);

    return (
        <div className='fixed bottom-5 right-10 transform -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-fade-up'>
            <div className='flex justify-between items-center mb-3'>
                <h3 className='font-semibold text-lg flex items-center'>
                    {allComplete ? (
                        <>
                            <FaCheckCircle className='text-green-500 mr-2' /> Upload complete
                        </>
                    ) : hasErrors ? (
                        <>
                            <FaExclamationCircle className='text-amber-500 mr-2' /> Upload with issues
                        </>
                    ) : (
                        <>Uploading files ({overallProgress}%)</>
                    )}
                </h3>
                <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
                    <FaTimesCircle size={18} />
                </button>
            </div>

            <div className='mb-3'>
                <div className='flex justify-between text-sm text-gray-600 mb-1'>
                    <span>
                        Overall progress ({uniqueFiles.filter((f) => f.status === 'complete').length}/{uniqueFiles.length})
                    </span>
                    <span>{overallProgress}%</span>
                </div>
                <div className='h-2 w-full bg-gray-200 rounded-full overflow-hidden'>
                    <div className={`h-full rounded-full ${hasErrors ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${overallProgress}%` }} />
                </div>
            </div>

            <div className='max-h-60 overflow-y-auto pr-1'>
                {uniqueFiles.map((file) => (
                    <div key={file.fileId} className='mb-2 last:mb-0'>
                        <div className='flex justify-between text-sm mb-1'>
                            <span className='truncate flex-1 pr-2' title={file.fileName}>
                                {file.fileName}
                            </span>
                            <span className='flex items-center'>
                                {file.status === 'complete' && <FaCheckCircle className='text-green-500 mr-1' />}
                                {file.status === 'error' && <FaExclamationCircle className='text-red-500 mr-1' />}
                                {file.progress}%
                            </span>
                        </div>
                        <div className='h-1.5 w-full bg-gray-200 rounded-full overflow-hidden'>
                            <div
                                className={`h-full rounded-full ${file.status === 'error' ? 'bg-red-500' : file.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${file.progress}%` }}
                            />
                        </div>
                        {file.status === 'error' && <p className='text-xs text-red-500 mt-0.5'>{file.error || 'Upload failed'}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
