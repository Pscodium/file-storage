import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import Uploader from '../uploader';
import { useDropzone } from 'react-dropzone';

export interface UploadDialogProps {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
    isOpen: boolean;
    onClickSubmit: (file: File | undefined) => void;
    mimetype?: FileTypes | undefined;
    fileName: string | undefined;
    setFileName: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export default function UploadDialog({ isOpen, setOpen, onClickSubmit, mimetype, fileName, setFileName }: UploadDialogProps) {
    const [file, setFile] = useState<File | undefined>(undefined);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const onDrop = useCallback((files: File[]) => {
        const file = files[0]
        setFileName(undefined);
        setFile(file);
        if (file) {
            setFile(file);
            const url = URL.createObjectURL(file);
            setFileUrl(url);
        }
      }, []);
    
      const dropzone = useDropzone({
        onDrop,
        accept: {
          [mimetype as string]: []
        },
      });

      const { getRootProps, getInputProps, isDragActive } = dropzone;

    useEffect(() => {
        setFile(undefined);
        setFileUrl(null);
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className='bg-white outline-none border-none z-[9999] flex flex-col items-center justify-center'>
                <DialogTitle className="text-[24px] text-black">Confirme Ação</DialogTitle>
                <DialogDescription className="text-[12px] text-black">
                    <div className='flex gap-1'>Envie um arquivo</div>
                </DialogDescription>
                <Uploader
                    className='flex w-full gap-3 items-center justify-center'
                    fileUrl={fileUrl}
                    mimetype={mimetype}
                    setFile={setFile}
                    size={file?.size}
                    setFileUrl={setFileUrl}
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    isDragActive={isDragActive}
                />
                {file && (
                    <div className='w-full flex px-[53px]'>
                        <input 
                            className='w-full h-6 border border-1 rounded-md'
                            placeholder={file?.name}
                            value={fileName}
                            onChange={(ev) => setFileName(ev.target.value)}
                        />
                    </div>
                )}
                <div className="flex gap-3">
                    <DialogTrigger>
                        <Button className="rounded-md bg-gray-500 text-white hover:bg-forum-navb font-bold">
                            CANCELAR
                        </Button>
                    </DialogTrigger>
                    <Button onClick={() => onClickSubmit(file)} disabled={!file} className="rounded-md bg-green-400 text-white hover:bg-forum-navb font-bold">
                        ENVIAR
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}