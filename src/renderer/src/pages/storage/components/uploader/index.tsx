/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { UploadIcon } from '@renderer/assets/icons/UploadIcon';
import { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';

export interface UploaderProps extends React.ComponentProps<'div'> {
    mimetype?: FileTypes;
    getRootProps: () => DropzoneRootProps;
    getInputProps: () => DropzoneInputProps;
    isDragActive: boolean;
    multiple?: boolean;
}

const LIMITER = 80;

export default function Uploader({ mimetype, getRootProps, getInputProps, isDragActive, multiple = false, ...props }: UploaderProps) {
    const [sizeLimiter, setSizeLimiter] = useState(false);

    useEffect(() => {
        if (isDragActive) {
            setSizeLimiter(false);
        }
    }, [isDragActive]);

    return (
        <div {...props}>
            <div
                {...getRootProps()}
                className={`
                    w-full h-[200px] p-6 rounded-lg border-dashed border-2 hover:border-gray-500 bg-white hover:bg-gray-50 transition-all
                    ${isDragActive ? 'border-blue-500 hover:border-blue-300' : 'border-gray-300'} ${sizeLimiter ? 'border-red-500 hover:bg-red-50 hover:border-red-300' : ''}`}
            >
                <label htmlFor='dropzone-file' className='cursor-pointer w-full h-full'>
                    <div className='flex flex-col items-center justify-center pt-5 pb-6 w-full h-full'>
                        <UploadIcon className={`w-10 h-10 mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'} ${sizeLimiter ? 'border-red-500' : ''}`} />
                        {isDragActive ? (
                            <p className='font-bold text-lg text-blue-400'>Drop to add files</p>
                        ) : (
                            <>
                                <p className='mb-2 text-lg text-gray-400'>
                                    <span className='font-bold'>Click to upload</span> or drag files here
                                </p>
                                <p className='text-gray-400 text-sm'>{multiple ? 'You can select multiple files' : 'Select a file'}</p>
                                <p className='text-gray-400 text-sm'>{mimetype ? mimetype.charAt(0).toUpperCase() + mimetype.slice(1).replace('/*', '') : ''}</p>
                                {sizeLimiter && <p className='text-red-500 text-sm font-bold'>Maximum size per file: {LIMITER}MB</p>}
                            </>
                        )}
                    </div>
                </label>
                <input {...getInputProps()} accept={mimetype} className='hidden' multiple={multiple} />
            </div>
        </div>
    );
}
