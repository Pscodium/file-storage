import { useEffect, useState } from 'react';
import { Desktop } from './components/desktop';
import { Files } from './components/files';
import { apiService } from '@renderer/services/api';
import { useAuth } from '@renderer/contexts/auth';
import { FaArrowLeft, FaPlus, FaSquareCheck, FaTrashCan } from 'react-icons/fa6';
import UploadDialog from './components/dialog/upload';
import { toast } from '@renderer/components/ui/use-toast';
import ContentDialog from './components/dialog/content';
import { Folders } from './components/folders';
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { IoSend } from "react-icons/io5";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@renderer/components/ui/select';

export interface StorageProps {}

export type WindowSteps = "FOLDERS" | "FILES";
enum Mimetypes {
    Video = "video/*",
    Audio = "audio/*",
    Image = "image/*"
}

export default function Storage() {
    const { user } = useAuth();
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openContentDialog, setOpenContentDialog] = useState(false);
    const [openFolderPopover, setOpenFolderPopover] = useState(false);
    const [folderTitle, setFolderTitle] = useState('');
    const [folderName, setFolderName] = useState('');
    const [folderType, setFolderType] = useState<FileTypes | undefined>(undefined);
    const [files, setFiles] = useState<IFileResponse | undefined>([]);
    const [file, setFile] = useState<IFile>();
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [hasUpload, setHasUpload] = useState(false);
    const [folders, setFolders] = useState<IFolderResponse>([])
    const [folder, setFolder] = useState<IFolder>();
    const [step, setStep] = useState<WindowSteps>('FOLDERS');
    const [confirming, setConfirming] = useState(false);
    const [timer, setTimer] = useState<null | number>(null);

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
        getFolders()
        getFiles()
    }, [])

    async function getFiles() {
        try {
            const data = await apiService.getFiles();

            if (!data) return;

            setFiles(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function getFolders() {
        try {
            const data = await apiService.getFolders();

            if (!data) return;

            setFolders(data);
        } catch (err) {
            console.error(err);
        }
    }

    function updateUploadPercentage(percentage: number) {
        setUploadPercentage(percentage);
    }

    async function uploadFileSubmit(file: File | undefined) {
        try {
            if (!file || !folder) return;
            setOpenUploadDialog(false);
            setHasUpload(true);

            const uploaded = await apiService.uploadFile(file, folder.id, updateUploadPercentage);

            if (uploaded) {
                toast({
                    variant: "destructive",
                    title: "SUCESSO",
                    description: "O arquivo foi enviado com sucesso",
                    className: "outline-none border-none bg-green-600 text-white",
                });
                setHasUpload(false);
                setUploadPercentage(0);
                handleSubmitFile()
            }
            
        } catch (err) {
            toast({
                variant: "destructive",
                title: "ERRO",
                description: "Erro ao tentar enviar o arquivo",
                className: "outline-none border-none bg-red-600 text-white",
            });

            console.error(err);
        }
    }

    async function deleteFile() {
        try {
            if (!file || !folder) return;

            await apiService.deleteFile(file.id, folder.id);

            toast({
                variant: "destructive",
                title: "SUCESSO",
                description: "O arquivo foi deletado com sucesso",
                className: "outline-none border-none bg-green-600 text-white",
            });
            setOpenContentDialog(false);
            setStep('FOLDERS');
            setFolder(undefined);
            getFolders();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "ERRO",
                description: "Erro ao tentar deletar o arquivo",
                className: "outline-none border-none bg-red-600 text-white",
            });

            console.error(err);
        }
    }
    
    async function deleteFolder() {
        try {
            if (!folder) return;
            await apiService.deleteStorageFolder(folder.id);

            setStep('FOLDERS');
            setFolder(undefined);
            getFolders();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "ERRO",
                description: "Erro ao tentar deletar o arquivo",
                className: "outline-none border-none bg-red-600 text-white",
            });

            console.error(err);
        }
    }

    async function createFolder() {
        setOpenFolderPopover(false)
        try {
            const data = await apiService.createFolder({
                folderName,
                type: folderType
            });

            if (!data) return;

            getFolders();
        } catch (err) {
            console.error(err);
        }
    }

    function openFileDialog(file: IFile) {
        setFile(file);
        setOpenContentDialog(true);
    }

    function handleOpenFolder(folder: IFolder) {
        setStep('FILES')
        setFolderTitle(folder.name);

        setFolder(folder);
        setFiles([]);
        setFiles(folder.Files);
    }

    function handleSubmitFile() {
        setStep('FOLDERS');
        setFolder(undefined);

        getFolders();
    }

    function returnToFolders() {
        setStep('FOLDERS')
        setFolder(undefined);
    }

    const handleDeleteClick = () => {
        if (confirming) {
            deleteFolder();
            setConfirming(false);
            clearTimeout(timer? timer : undefined);
            setTimer(null);
        } else {
            setConfirming(true);
            setTimer(Date.now());
        }
    };

    return (
        <div className='min-h-screen w-full items-center justify-center'>
            <div className='absolute w-full h-7 drag' />
            <Desktop.Root>
                <Desktop.Window>
                    {step === 'FOLDERS' && (
                        <>
                            {user && user?.role === 'owner' && (
                                <div className="no-drag absolute h-[20px] top-[5px] z-[999] pointer-events-auto ml-1 cursor-pointer">
                                    <Popover onOpenChange={() => setOpenFolderPopover(!openFolderPopover)} open={openFolderPopover}>
                                        <PopoverTrigger>
                                            <FaPlus />
                                        </PopoverTrigger>
                                        <PopoverContent className='flex flex-col gap-2 bg-white' side='bottom'>
                                            <div className='flex gap-1'>
                                                <Input value={folderName} onChange={(ev) => setFolderName(ev.target.value)} className='!outline-none' />
                                                <Button onClick={createFolder} className='bg-green-400 hover:bg-green-200'>
                                                    <IoSend color='#ffffff' />
                                                </Button>
                                            </div>
                                            <Select value={folderType} onValueChange={(value) => setFolderType(value as FileTypes)} >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent className='bg-white'>
                                                    <SelectItem value={Mimetypes.Video}>Video</SelectItem>
                                                    <SelectItem value={Mimetypes.Audio}>Audio</SelectItem>
                                                    <SelectItem value={Mimetypes.Image}>Image</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                            <Desktop.WindowHeader>
                                Storage
                            </Desktop.WindowHeader>
                            <Desktop.WindowContent>
                                <Folders.Root className="flex flex-wrap gap-3 pt-7">
                                    {folders.map((folder, index) => (
                                        <Folders.Body hover={folder.name} key={index} onClick={() => handleOpenFolder(folder)} className="p-5 hover:bg-blue-gray-50 w-32 rounded-md text-center relative cursor-pointer">
                                            <Folders.Icon hex={folder.hex} />
                                            {folder.filesCount != undefined && (
                                                <Folders.Badge>{folder.filesCount}</Folders.Badge>
                                            )}
                                            <Folders.Title>{folder.name}</Folders.Title>
                                        </Folders.Body>
                                    ))}
                                </Folders.Root>
                            </Desktop.WindowContent>
                        </>
                    )}
                    {step === 'FILES' && (
                        <>
                            <div onClick={returnToFolders} className="absolute no-drag top-[6px] z-[999] ml-2 cursor-pointer pointer-events-auto">
                                <FaArrowLeft />
                            </div>
                            {user && user?.role === 'owner' && (
                                <>
                                    <div onClick={() => setOpenUploadDialog(true)} className="absolute h-[20px] no-drag top-[6px] z-[9999] ml-9 cursor-pointer pointer-events-auto">
                                        <FaPlus />
                                    </div>
                                    <div onClick={handleDeleteClick} className="absolute no-drag top-[6px] z-[999] h-[20px] ml-[70px] cursor-pointer pointer-events-auto">
                                    {confirming? 
                                        <FaSquareCheck color="#ffcc00" className='h-4 w-4' />
                                        :
                                        <FaTrashCan color="#FF3366" className='h-4 w-4' />
                                    }
                                    </div>
                                </>
                            )}
                            <Desktop.WindowHeader>
                                {folderTitle}
                            </Desktop.WindowHeader>
                            <Desktop.WindowContent>
                                <Files.Root className="flex flex-wrap gap-3 pt-7">
                                    {files && files.map((object, index) => (
                                        <Files.Body onClick={() => openFileDialog(object)} hover={object.name} key={index} className="p-5 hover:bg-blue-gray-50 w-32 rounded-md text-center relative cursor-pointer">
                                            <Files.Icon url={object.url} type={folder?.type} />
                                            {folder?.type && folder.type !== 'video/*' && (
                                                <Files.Title>{object.name}</Files.Title>
                                            )}
                                        </Files.Body>
                                    ))}
                                </Files.Root>
                            </Desktop.WindowContent>
                        </>
                    )}
                </Desktop.Window>
            </Desktop.Root>
            {hasUpload && (
                <div className='absolute animate-fade-up bg-gray-50 flex flex-col gap-3 border-gray-100 border-1 py-1 px-3 border shadow-lg rounded-lg w-1/2 bottom-5 inset-x-1/4'>
                    <div className='w-full flex items-center justify-between'>
                        <p>Uploading... {uploadPercentage}%</p>
                        <div className="flex justify-center items-center">
                            <div className="w-4 h-4 border-[1px] border-blue-500 border-dashed rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <div className="relative flex h-5 w-full overflow-hidden rounded-full bg-gray-200 p-1 shadow-3xl">
                        <div
                            className={"relative h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-950"}
                            style={{ width: `${uploadPercentage}%` }}
                        />
                    </div>
                </div>
            )}
            <UploadDialog
                isOpen={openUploadDialog}
                mimetype={folder?.type}
                setOpen={setOpenUploadDialog}
                onClickSubmit={uploadFileSubmit}
            />
            <ContentDialog 
                file={file}
                folder={folder}
                isOpen={openContentDialog}
                setOpen={setOpenContentDialog}
                deleteFile={deleteFile}
            />
        </div>
    );
}