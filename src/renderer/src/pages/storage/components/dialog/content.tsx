import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@renderer/components/ui/dialog';
import { FaSquareCheck, FaCheck, FaCopy, FaTrashCan } from 'react-icons/fa6';
import { useAuth } from '@renderer/contexts/auth';
import AudioPlayer from '../player/audio';
import VideoPlayer from '../player/video';

export interface ContentDialogProps {
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
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
            setWindowHeight(window.innerHeight)
        }
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, [])

    const handleDeleteClick = () => {
        if (confirming) {
            deleteFile();
            setConfirming(false);
            clearTimeout(timer? timer : undefined);
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

    
    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className='bg-white outline-none border-none z-[999] flex flex-col overflow-y-auto' style={{ maxHeight: windowHeight - 80}}>
                <DialogTitle className="text-[24px] text-black">File</DialogTitle>
                <DialogDescription>{file?.name}</DialogDescription>
                <div className='flex w-full'>
                    {folder && file && folder.type === 'video/*' && (
                        <VideoPlayer url={file.url} />
                    )}
                    {folder && file && folder.type === 'image/*' && (
                        <img src={file.url} className='w-full' />
                    )}
                    {folder && file && folder.type === 'audio/*' && (
                        <AudioPlayer url={file.url} className='w-full' />
                    )}
                    {folder && file && !folder.type && (
                        <img src={file.url} className='w-full' />
                    )}
                </div>
                <div className='w-full flex justify-between'>
                    <div onClick={copyToClipboard} className='cursor-pointer'>
                        {successCopy ? <FaCheck className='fill-gray-500' /> : <FaCopy className='fill-gray-500' />}
                    </div>

                    {user?.role == 'owner' && (
                        <button className='self-center' onClick={handleDeleteClick}>
                            {confirming? 
                                <FaSquareCheck color="#ffcc00" className='h-4 w-4' />
                                :
                                <FaTrashCan color="#FF3366" className='h-4 w-4' />
                            }
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}