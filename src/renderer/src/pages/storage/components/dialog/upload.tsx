import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import Uploader from '../uploader';
import { useDropzone } from 'react-dropzone';
import { Input } from '@renderer/components/ui/input';
import { FaTrashCan } from 'react-icons/fa6';

export interface UploadDialogProps {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOpen: boolean;
    onClickSubmit: (files: File[]) => void;
    mimetype?: FileTypes | undefined;
}

export default function UploadDialog({ isOpen, setOpen, onClickSubmit, mimetype }: UploadDialogProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [fileUrls, setFileUrls] = useState<string[]>([]);
    const [fileNames, setFileNames] = useState<string[]>([]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);

        // Generate preview URLs for each file
        const urls = acceptedFiles.map((file) => URL.createObjectURL(file));
        setFileUrls((prevUrls) => [...prevUrls, ...urls]);

        // Initialize file names
        setFileNames((prevNames) => [
            ...prevNames,
            ...acceptedFiles.map((file) => {
                const nameParts = file.name.split('.');
                nameParts.pop(); // Remove extension
                return nameParts.join('.');
            }),
        ]);
    }, []);

    const dropzone = useDropzone({
        onDrop,
        accept: {
            [mimetype as string]: [],
        },
        multiple: true, // Enable multiple file selection
    });

    const { getRootProps, getInputProps, isDragActive } = dropzone;

    const handleRemoveFile = (index: number) => {
        // Remove file
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));

        // Clean up URL object to avoid memory leaks
        if (fileUrls[index]) {
            URL.revokeObjectURL(fileUrls[index]);
        }

        // Remove URL and name
        setFileUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
        setFileNames((prevNames) => prevNames.filter((_, i) => i !== index));
    };

    const handleFileNameChange = (index: number, name: string) => {
        setFileNames((prevNames) => {
            const newNames = [...prevNames];
            newNames[index] = name;
            return newNames;
        });
    };

    useEffect(() => {
        if (!isOpen) {
            // Clean up when dialog closes
            fileUrls.forEach((url) => URL.revokeObjectURL(url));
            setFiles([]);
            setFileUrls([]);
            setFileNames([]);
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className='bg-white outline-none border-none z-[9999] flex flex-col items-center justify-center max-h-[90vh] overflow-y-auto'>
                <DialogTitle className='text-[24px] text-black'>Upload Files</DialogTitle>
                <DialogDescription className='text-[12px] text-black'>
                    <div className='flex gap-1'>Upload multiple files to this folder</div>
                </DialogDescription>

                <Uploader
                    className='flex w-full gap-3 items-center justify-center'
                    mimetype={mimetype}
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    isDragActive={isDragActive}
                    multiple={true}
                />

                {files.length > 0 && (
                    <div className='w-full max-h-60 overflow-y-auto'>
                        <h3 className='text-lg font-medium my-2'>Selected Files ({files.length})</h3>
                        {files.map((file, index) => (
                            <div key={index} className='flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-md'>
                                <div className='w-10 h-10 flex-shrink-0 bg-gray-200 rounded-md overflow-hidden'>
                                    {mimetype?.startsWith('image') && fileUrls[index] && <img src={fileUrls[index]} alt={file.name} className='w-full h-full object-cover' />}
                                    {(!mimetype?.startsWith('image') || !fileUrls[index]) && (
                                        <div className='w-full h-full flex items-center justify-center text-gray-500'>{file.name.split('.').pop()?.toUpperCase()}</div>
                                    )}
                                </div>
                                <div className='flex-grow'>
                                    <div className='text-sm font-medium mb-1 truncate' title={file.name}>
                                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                    </div>
                                    <Input
                                        className='h-8 text-xs'
                                        placeholder='Custom filename (optional)'
                                        value={fileNames[index] || ''}
                                        onChange={(e) => handleFileNameChange(index, e.target.value)}
                                    />
                                </div>
                                <button onClick={() => handleRemoveFile(index)} className='p-1 hover:bg-gray-200 rounded-full' title='Remove file'>
                                    <FaTrashCan className='text-red-500 h-4 w-4' />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className='flex gap-3 mt-3'>
                    <DialogTrigger>
                        <Button className='rounded-md bg-gray-500 text-white hover:bg-forum-navb font-bold'>CANCEL</Button>
                    </DialogTrigger>
                    <Button onClick={() => onClickSubmit(files)} disabled={files.length === 0} className='rounded-md bg-green-400 text-white hover:bg-forum-navb font-bold'>
                        UPLOAD {files.length > 0 ? `(${files.length})` : ''}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
