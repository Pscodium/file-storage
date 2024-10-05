import React, { useEffect, useRef, useState } from 'react';
import Image from '../image';
import { IoClose } from "react-icons/io5";
import { VideoPreview } from '../player/videoPreview';
import AudioPlayer from '../player/audio';
import { UploadIcon } from '@renderer/assets/icons/UploadIcon';
import { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';

export interface UploaderProps extends React.ComponentProps<'div'> {
    setFile:  React.Dispatch<React.SetStateAction<File | undefined>>;
    setFileUrl: React.Dispatch<React.SetStateAction<string | null>>;
    mimetype?: FileTypes;
    fileUrl: string | null;
    getRootProps: () => DropzoneRootProps;
    getInputProps: () => DropzoneInputProps;
    isDragActive: boolean;
    size?: number;
}

const MEGABYTE = 1048576;
const LIMITER = 80;

export default function Uploader({ setFile, setFileUrl, fileUrl, mimetype, getRootProps, getInputProps, isDragActive, size, ...props }: UploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sizeLimiter, setSizeLimiter] = useState(false);

    function handleClickFileUpload() {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    function removePostPhoto() {
        setFileUrl(null);
        setFile(undefined);
    }

    useEffect(() => {
        if (size) {
            if (size > (MEGABYTE * LIMITER)) {
                setFileUrl(null);
                setFile(undefined);
                setSizeLimiter(true);
            } else {
                setSizeLimiter(false);
            }
        }
    }, [size])

    useEffect(() => {
        if (isDragActive) {
            setSizeLimiter(false);
        }
    }, [isDragActive])

    return (
        <div {...props}>
            <button onClick={handleClickFileUpload} className='hover:bg-blue-gray-50 rounded-md p-2 hover:opacity-70 animate-fade-down items-center justify-center flex'>
                {!fileUrl && (
                    <div 
                        {...getRootProps()}
                        className={`
                            w-full h-[200px] p-6 rounded-lg border-dashed border-2 hover:border-gray-500 bg-white hover:bg-gray-50 transition-all
                            ${isDragActive ? 'border-blue-500 hover:border-blue-300' : 'border-gray-300'} ${sizeLimiter? 'border-red-500 hover:bg-red-50 hover:border-red-300' : ''}`}
                    >
                        <label htmlFor="dropzone-file" className="cursor-pointer w-full h-full">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full h-full">
                            <UploadIcon
                                className={`w-10 h-10 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'} ${sizeLimiter? 'border-red-500' : ''}`}
                            />
                            {isDragActive ? (
                                <p className="font-bold text-lg text-blue-400">Solte para adicionar</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-lg text-gray-400">
                                        <span className="font-bold">Clique para enviar</span> ou arraste até aqui
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        {mimetype ? mimetype.charAt(0).toUpperCase() + mimetype.slice(1).replace('/*', '') : ''}
                                    </p>
                                </>
                            )}
                            {sizeLimiter && (
                                <p className="text-red-500 text-sm font-bold">
                                    Tamanho máximo de {LIMITER}MB
                                </p>
                            )}
                            </div>
                        </label>
                        <input {...getInputProps()} accept={mimetype} className="hidden" />
                    </div>
                )}
                {fileUrl ? 
                    <div className='relative'>
                        {mimetype && mimetype == 'video/*' && (
                            <VideoPreview url={fileUrl} className='h-[180px] w-[180px] rounded-lg object-cover' />
                        )}
                        {mimetype && mimetype == 'audio/*' && (
                            <AudioPlayer url={fileUrl} className='w-[350px] rounded-lg object-cover' />
                        )}
                        {mimetype && mimetype == 'image/*' && (
                            <Image source={fileUrl} className='h-[180px] w-[180px] rounded-lg object-cover' />
                        )}
                        {!mimetype && (
                            <Image source={fileUrl} className='h-[180px] w-[180px] rounded-lg object-cover' />
                        )}
                        {fileUrl && (
                            <div className='absolute bg-red-300 hover:bg-red-400 rounded-full flex flex-col gap-3 -right-2 -top-2'>
                                <button className='self-center underline text-white' onClick={removePostPhoto}>
                                    <IoClose className='w-[22px] h-[22px]' />
                                </button>
                            </div>
                        )}
                    </div>
                    : 
                    <div className='h-[180px] w-[180px] rounded-lg object-cover hidden' />
                }
                
            </button>
            

        </div>
    );
}