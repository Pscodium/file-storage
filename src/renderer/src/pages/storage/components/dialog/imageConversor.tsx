import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@renderer/components/ui/dialog';
import ImageConversor from '../conversor/image';

export interface ImageConversorDialogProps {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOpen: boolean;
}

export default function ImageConversorDialog({ isOpen, setOpen }: ImageConversorDialogProps) {
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        function handleResize() {
            setWindowHeight(window.innerHeight);
        }
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className='bg-white outline-none border-none z-[999] flex flex-col overflow-y-auto' style={{ maxHeight: windowHeight - 80 }}>
                <DialogTitle className='text-[24px] text-black'>Image Converter</DialogTitle>
                <DialogDescription>Converta suas imagens</DialogDescription>
                <ImageConversor.Root>
                    <ImageConversor.FormatSelector />
                    <ImageConversor.FormatOutputSelector />
                    <ImageConversor.SizeControl />
                    <ImageConversor.ImageUploader />
                    <ImageConversor.ConvertButton />
                    <ImageConversor.ImageConverted />
                </ImageConversor.Root>
            </DialogContent>
        </Dialog>
    );
}
