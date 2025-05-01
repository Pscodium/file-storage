/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-interface */
import { useEffect, useRef, useState } from 'react';
import { Desktop } from './components/desktop';
import { Files } from './components/files';
import { apiService } from '@renderer/services/api';
import { useAuth } from '@renderer/contexts/auth';
import { FaArrowLeft, FaPlus, FaSquareCheck, FaTrashCan, FaLock, FaUnlock } from 'react-icons/fa6';
import UploadDialog from './components/dialog/upload';
import { toast } from '@renderer/components/ui/use-toast';
import ContentDialog from './components/dialog/content';
import { Folders } from './components/folders';
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover';
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { IoSend } from 'react-icons/io5';
import { FaSyncAlt } from 'react-icons/fa';
import randomColor from 'randomcolor';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@renderer/components/ui/select';
import { TailSpin } from 'react-loader-spinner';
import ImageConversorDialog from './components/dialog/imageConversor';
import SearchInput from './components/search';
import { OrderMenu } from '@renderer/components/SortMenu';
import { useOrder } from '@renderer/contexts/order';
import { Switch } from '@renderer/components/ui/switch';
import { useSocket } from '@renderer/services/socket';
import DeleteProgress, { FileDeleteProgress } from './components/delete-progress';
import { FaCheck, FaTrashAlt } from 'react-icons/fa';
import UploadProgress, { FileUploadProgress } from './components/upload-progress';

export interface StorageProps {}

export type WindowSteps = 'FOLDERS' | 'FILES';
enum Mimetypes {
    Video = 'video/*',
    Audio = 'audio/*',
    Image = 'image/*',
}

export default function Storage() {
    const { user } = useAuth();
    const { fileOrder, folderOrder, setOrderFile, setOrderFolder } = useOrder();
    const [openUploadDialog, setOpenUploadDialog] = useState(false);
    const [openContentDialog, setOpenContentDialog] = useState(false);
    const [openImageConversorDialog, setOpenImageConversorDialog] = useState(false);
    const [openFolderPopover, setOpenFolderPopover] = useState(false);
    const [folderTitle, setFolderTitle] = useState('');
    const [folderName, setFolderName] = useState('');
    const [folderPrivate, setFolderPrivate] = useState(false);
    const [hex, setHex] = useState<string | undefined>(randomColor());
    const [folderType, setFolderType] = useState<FileTypes | undefined>(undefined);
    const [files, setFiles] = useState<IFileResponse | undefined>([]);
    const [file, setFile] = useState<IFile>();
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [hasDelete, setHasDelete] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [deleteProgressVisible, setDeleteProgressVisible] = useState(false);
    const [fileDeletes, setFileDeletes] = useState<FileDeleteProgress[]>([]);
    const [folders, setFolders] = useState<IFolderResponse>([]);
    const [folder, setFolder] = useState<IFolder>();
    const [step, setStep] = useState<WindowSteps>('FOLDERS');
    const [confirming, setConfirming] = useState(false);
    const [timer, setTimer] = useState<null | number>(null);
    const [fileSearch, setFileSearch] = useState<string>('');
    const [folderSearch, setFolderSearch] = useState<string>('');
    const colorPickerRef = useRef<HTMLInputElement>(null);
    const filteredFiles = fileSearch.length > 0 ? files?.filter((file) => file.name.toLowerCase().includes(fileSearch.toLowerCase())) : files;
    const filteredFolders = folderSearch.length > 0 ? folders.filter((folder) => folder.name.toLowerCase().includes(folderSearch.toLowerCase())) : folders;

    const [uploadProgressVisible, setUploadProgressVisible] = useState(false);
    const [fileUploads, setFileUploads] = useState<FileUploadProgress[]>([]);
    const { socket, initSocket } = useSocket();

    const sortedFiles = orderList(filteredFiles || [], fileOrder);
    const sortedFolders = orderList(filteredFolders || [], folderOrder);

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
        getFolders();
        getFiles();
    }, []);

    useEffect(() => {
        if (user) {
            getFolders();
        }
    }, [user]);

    useEffect(() => {
        if (openFolderPopover) {
            setHex(randomColor());
        }
    }, [openFolderPopover]);

    useEffect(() => {
        if (socket) {
            socket.off(`delete-progress-${user?.id}`);
            socket.off(`delete-complete-${user?.id}`);
            socket.off(`delete-error-${user?.id}`);
            socket.off(`delete-all-complete-${user?.id}`);
        }

        if (user?.id && !socket) {
            initSocket();
        }

        if (socket) {
            socket.on(`delete-progress-${user?.id}`, (data: { deleteId: string; fileId: string; fileName?: string; progress: number; index: number; total: number }) => {
                setFileDeletes((prevDeletes) => {
                    const existingIndex = prevDeletes.findIndex((del) => del.deleteId === data.deleteId);

                    if (existingIndex >= 0) {
                        if (prevDeletes[existingIndex].progress === data.progress) {
                            return prevDeletes;
                        }

                        const newDeletes = [...prevDeletes];
                        newDeletes[existingIndex] = {
                            ...newDeletes[existingIndex],
                            progress: data.progress,
                            fileName: data.fileName || newDeletes[existingIndex].fileName,
                            status: data.progress === 100 ? 'complete' : 'deleting',
                        };
                        return newDeletes;
                    } else {
                        return [
                            ...prevDeletes,
                            {
                                deleteId: data.deleteId,
                                fileId: data.fileId,
                                fileName: data.fileName,
                                progress: data.progress,
                                status: 'deleting',
                                index: data.index,
                                total: data.total,
                            },
                        ];
                    }
                });

                setDeleteProgressVisible(true);
            });

            socket.on(`delete-complete-${user?.id}`, (data: { deleteId: string; fileId: string; fileName?: string; index: number }) => {
                setFileDeletes((prevDeletes) => {
                    const existingIndex = prevDeletes.findIndex((del) => del.deleteId === data.deleteId);

                    if (existingIndex >= 0) {
                        if (prevDeletes[existingIndex].status === 'complete' && prevDeletes[existingIndex].progress === 100) {
                            return prevDeletes;
                        }

                        const newDeletes = [...prevDeletes];
                        newDeletes[existingIndex] = {
                            ...newDeletes[existingIndex],
                            progress: 100,
                            status: 'complete',
                            fileName: data.fileName || newDeletes[existingIndex].fileName,
                        };
                        return newDeletes;
                    }
                    return prevDeletes;
                });
            });

            socket.on(`delete-error-${user?.id}`, (data: { deleteId?: string; fileId?: string; fileName?: string; error: string; index?: number }) => {
                if (data.deleteId) {
                    setFileDeletes((prevDeletes) => {
                        const existingIndex = prevDeletes.findIndex((del) => del.deleteId === data.deleteId);

                        if (existingIndex >= 0) {
                            const newDeletes = [...prevDeletes];
                            newDeletes[existingIndex] = {
                                ...newDeletes[existingIndex],
                                status: 'error',
                                error: data.error,
                                fileName: data.fileName || newDeletes[existingIndex].fileName,
                            };
                            return newDeletes;
                        }
                        return prevDeletes;
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'ERRO',
                        description: data.error || 'Erro durante a exclusão',
                        className: 'outline-none border-none bg-red-600 text-white',
                    });
                }
            });

            socket.on(`delete-all-complete-${user?.id}`, async (data: { sessionId: string; folderId: string; folderData?: IFolder; totalFiles: number; deletedFiles: string[] }) => {
                setFileDeletes((prevDeletes) =>
                    prevDeletes.map((del) => ({
                        ...del,
                        status: del.status === 'deleting' ? 'complete' : del.status,
                        progress: del.status === 'deleting' ? 100 : del.progress,
                    }))
                );

                await getFolders();

                if (folder) {
                    const updatedFolders = await getFolders();
                    if (updatedFolders) {
                        const currentFolder = updatedFolders.find((f) => f.id === folder.id);
                        if (currentFolder) {
                            setFolder(currentFolder);
                            setFiles(currentFolder.Files || []);
                        }
                    }
                }

                setSelectedFiles([]);
                setSelectionMode(false);

                toast({
                    variant: 'destructive',
                    title: 'SUCESSO',
                    description: `${data.totalFiles} arquivo(s) excluído(s) com sucesso`,
                    className: 'outline-none border-none bg-green-600 text-white',
                });

                setTimeout(() => {
                    if (fileDeletes.every((f) => f.status !== 'deleting')) {
                        setDeleteProgressVisible(false);
                        setFileDeletes([]);
                    }
                }, 5000);
            });
        }

        return () => {
            if (socket) {
                socket.off(`delete-progress-${user?.id}`);
                socket.off(`delete-complete-${user?.id}`);
                socket.off(`delete-error-${user?.id}`);
                socket.off(`delete-all-complete-${user?.id}`);
            }
        };
    }, [socket, user?.id]);

    useEffect(() => {
        if (socket) {
            socket.off(`upload-progress-${user?.id}`);
            socket.off(`upload-complete-${user?.id}`);
            socket.off(`upload-error-${user?.id}`);
            socket.off(`upload-all-complete-${user?.id}`);
        }

        if (user?.id && !socket) {
            initSocket();
        }

        if (socket) {
            socket.on(`upload-progress-${user?.id}`, (data: { fileId: string; fileName: string; progress: number; index: number; total: number }) => {
                setFileUploads((prevUploads) => {
                    const existingIndex = prevUploads.findIndex((upload) => upload.fileId === data.fileId);

                    if (existingIndex >= 0) {
                        if (prevUploads[existingIndex].progress === data.progress) {
                            return prevUploads;
                        }

                        const newUploads = [...prevUploads];
                        newUploads[existingIndex] = {
                            ...newUploads[existingIndex],
                            progress: data.progress,
                            status: data.progress === 100 ? 'complete' : 'uploading',
                        };
                        return newUploads;
                    } else {
                        if (prevUploads.length >= data.total) {
                            console.warn('Tentando adicionar mais arquivos do que o esperado', {
                                current: prevUploads.length,
                                expected: data.total,
                            });
                            return prevUploads;
                        }

                        return [
                            ...prevUploads,
                            {
                                fileId: data.fileId,
                                fileName: data.fileName,
                                progress: data.progress,
                                status: 'uploading',
                                index: data.index,
                                total: data.total,
                            },
                        ];
                    }
                });

                setUploadProgressVisible(true);
            });

            socket.on(`upload-complete-${user?.id}`, (data: { fileId: string; fileName: string; index: number }) => {
                setFileUploads((prevUploads) => {
                    const existingIndex = prevUploads.findIndex((upload) => upload.fileId === data.fileId);

                    if (existingIndex >= 0) {
                        if (prevUploads[existingIndex].status === 'complete' && prevUploads[existingIndex].progress === 100) {
                            return prevUploads;
                        }

                        const newUploads = [...prevUploads];
                        newUploads[existingIndex] = {
                            ...newUploads[existingIndex],
                            progress: 100,
                            status: 'complete',
                        };
                        return newUploads;
                    }
                    return prevUploads;
                });
            });

            // Error handler
            socket.on(`upload-error-${user?.id}`, (data: { fileId?: string; fileName?: string; error: string; index?: number }) => {
                if (data.fileId) {
                    setFileUploads((prevUploads) => {
                        const existingIndex = prevUploads.findIndex((upload) => upload.fileId === data.fileId);

                        if (existingIndex >= 0) {
                            const newUploads = [...prevUploads];
                            newUploads[existingIndex] = {
                                ...newUploads[existingIndex],
                                status: 'error',
                                error: data.error,
                            };
                            return newUploads;
                        }
                        return prevUploads;
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'ERRO',
                        description: data.error || 'Erro durante o upload',
                        className: 'outline-none border-none bg-red-600 text-white',
                    });
                }
            });

            socket.on(`upload-all-complete-${user?.id}`, async (data: { folderId: string; totalFiles: number; filesData: any[]; folderData?: IFolder }) => {
                setFileUploads((prevUploads) =>
                    prevUploads.map((upload) => ({
                        ...upload,
                        status: upload.status === 'uploading' ? 'complete' : upload.status,
                        progress: upload.status === 'uploading' ? 100 : upload.progress,
                    }))
                );

                await getFolders();

                if (folder) {
                    const updatedFolders = await getFolders();
                    if (updatedFolders) {
                        const currentFolder = updatedFolders.find((f) => f.id === folder.id);
                        if (currentFolder) {
                            setFolder(currentFolder);
                            setFiles(currentFolder.Files || []);
                        }
                    }
                }

                toast({
                    variant: 'destructive',
                    title: 'SUCESSO',
                    description: `${data.totalFiles} arquivo(s) enviado(s) com sucesso`,
                    className: 'outline-none border-none bg-green-600 text-white',
                });

                setTimeout(() => {
                    if (fileUploads.every((f) => f.status !== 'uploading')) {
                        setUploadProgressVisible(false);
                        setFileUploads([]);
                    }
                }, 5000);
            });
        }

        return () => {
            if (socket) {
                socket.off(`upload-progress-${user?.id}`);
                socket.off(`upload-complete-${user?.id}`);
                socket.off(`upload-error-${user?.id}`);
                socket.off(`upload-all-complete-${user?.id}`);
            }
        };
    }, [socket, user?.id, folder]);

    function orderList(list: IFileResponse | IFolderResponse, criterion: OrderOptions): IFileResponse | IFolderResponse {
        switch (criterion) {
            case 'date-ascending':
                return [...list].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()) as IFileResponse | IFolderResponse;
            case 'date-descending':
                return [...list].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()) as IFileResponse | IFolderResponse;
            case 'name-alphabetical':
                return [...list].sort((a, b) => a.name.localeCompare(b.name)) as IFileResponse | IFolderResponse;
            case 'name-reverse-alphabetical':
                return [...list].sort((a, b) => b.name.localeCompare(a.name)) as IFileResponse | IFolderResponse;
            default:
                return list;
        }
    }

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

            return data;
        } catch (err) {
            console.error(err);
            return undefined;
        }
    }

    async function uploadMultipleFiles(files: File[]) {
        try {
            if (!files.length || !folder) return;
            setOpenUploadDialog(false);

            setFileUploads([]);
            setUploadProgressVisible(true);

            const timestamp = Date.now();
            const initialUploads = files.map((file, index) => ({
                fileId: `${timestamp}-${index}`,
                fileName: fileNames[index] || file.name,
                progress: 0,
                status: 'uploading' as const,
                index,
                total: files.length,
            }));

            setFileUploads(initialUploads);

            await apiService.uploadMultipleFiles(files, folder.id, fileNames);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'ERRO',
                description: 'Erro ao tentar enviar os arquivos',
                className: 'outline-none border-none bg-red-600 text-white',
            });

            console.error(err);
        }
    }

    function toggleSelectionMode() {
        setSelectionMode(!selectionMode);
        if (selectionMode) {
            setSelectedFiles([]);
        }
    }

    function toggleFileSelection(fileId: string) {
        if (selectedFiles.includes(fileId)) {
            setSelectedFiles(selectedFiles.filter((id) => id !== fileId));
        } else {
            setSelectedFiles([...selectedFiles, fileId]);
        }
    }

    function selectAllFiles() {
        if (files?.length) {
            if (selectedFiles.length === files.length) {
                setSelectedFiles([]);
            } else {
                setSelectedFiles(files.map((file) => file.id));
            }
        }
    }

    async function deleteMultipleFiles() {
        try {
            if (!selectedFiles.length || !folder) return;

            if (!window.confirm(`Tem certeza que deseja excluir ${selectedFiles.length} arquivo(s)?`)) {
                return;
            }

            setFileDeletes([]);
            setDeleteProgressVisible(true);

            await apiService.deleteMultipleFiles(selectedFiles, folder.id);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'ERRO',
                description: 'Erro ao tentar excluir os arquivos',
                className: 'outline-none border-none bg-red-600 text-white',
            });

            console.error(err);
        }
    }

    async function deleteFile() {
        try {
            if (!file || !folder) return;
            setOpenContentDialog(false);
            setHasDelete(true);

            await apiService.deleteFile(file.id, folder.id);

            toast({
                variant: 'destructive',
                title: 'SUCESSO',
                description: 'O arquivo foi deletado com sucesso',
                className: 'outline-none border-none bg-green-600 text-white',
            });
            setHasDelete(false);

            const newFolders = await getFolders();
            if (folder && newFolders) {
                const foundFolder = newFolders.find((f) => f.id === folder?.id);
                if (foundFolder) {
                    handleOpenFolder(foundFolder);
                    setStep('FILES');
                }
            }
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'ERRO',
                description: 'Erro ao tentar deletar o arquivo',
                className: 'outline-none border-none bg-red-600 text-white',
            });

            console.error(err);
        }
    }

    async function deleteFolder() {
        try {
            if (!folder) return;
            setHasDelete(true);

            await apiService.deleteStorageFolder(folder.id);

            setStep('FOLDERS');
            setHasDelete(false);
            setFolder(undefined);
            getFolders();
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'ERRO',
                description: 'Erro ao tentar deletar o arquivo',
                className: 'outline-none border-none bg-red-600 text-white',
            });

            console.error(err);
        }
    }

    async function createFolder() {
        setOpenFolderPopover(false);
        try {
            const data = await apiService.createFolder({
                folderName,
                type: folderType,
                privateFolder: folderPrivate,
                hex,
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
        setStep('FILES');
        setFolderTitle(folder.name);

        setFolder(folder);
        setFiles([]);
        setFiles(folder.Files);
        setFolderSearch('');
    }

    function returnToFolders() {
        setStep('FOLDERS');
        setFolder(undefined);
        setFileSearch('');
    }

    const handleDeleteClick = () => {
        if (confirming) {
            deleteFolder();
            setConfirming(false);
            clearTimeout(timer ? timer : undefined);
            setTimer(null);
        } else {
            setConfirming(true);
            setTimer(Date.now());
        }
    };

    const handleColorChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setHex(ev.target.value);
    };

    return (
        <div className='min-h-screen w-full items-center justify-center'>
            <div className='absolute w-full h-7 drag' />
            <Desktop.Root>
                <Desktop.Window>
                    {step === 'FOLDERS' && (
                        <>
                            <div className='absolute top-[30px] right-[5px]'>
                                <OrderMenu actualOrder={folderOrder} onOrder={(newOrder) => setOrderFolder(newOrder)} />
                            </div>
                            {user && user?.role === 'owner' && (
                                <div className='no-drag flex items-center gap-2 absolute h-[20px] top-[5px] z-[999] pointer-events-auto ml-1 cursor-pointer'>
                                    <Popover onOpenChange={() => setOpenFolderPopover(!openFolderPopover)} open={openFolderPopover}>
                                        <PopoverTrigger>
                                            <FaPlus className='hover:fill-gray-600 fill-black' />
                                        </PopoverTrigger>
                                        <PopoverContent className='flex flex-col gap-2 bg-white' side='bottom'>
                                            <div className='flex gap-1'>
                                                <Input value={folderName} onChange={(ev) => setFolderName(ev.target.value)} className='!outline-none' />
                                                <Button onClick={createFolder} className='bg-green-400 hover:bg-green-200'>
                                                    <IoSend color='#ffffff' />
                                                </Button>
                                            </div>
                                            <div className='flex gap-1'>
                                                <Select value={folderType} onValueChange={(value) => setFolderType(value as FileTypes)}>
                                                    <SelectTrigger className=''>
                                                        <SelectValue placeholder='Tipo' />
                                                    </SelectTrigger>
                                                    <SelectContent className='bg-white'>
                                                        <SelectItem value={Mimetypes.Video}>Video</SelectItem>
                                                        <SelectItem value={Mimetypes.Audio}>Audio</SelectItem>
                                                        <SelectItem value={Mimetypes.Image}>Image</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <div className='flex flex-col justify-center items-center gap-1 px-[9px]'>
                                                    {folderPrivate ? <FaLock className='fill-gray-600' /> : <FaUnlock className='fill-gray-600' />}
                                                    <Switch checked={folderPrivate} onCheckedChange={(check) => setFolderPrivate(check)} color='#000' className='shadow-md' />
                                                </div>
                                                <div className='flex flex-col items-center justify-center relative'>
                                                    <div className='relative'>
                                                        <input
                                                            type='color'
                                                            ref={colorPickerRef}
                                                            value={hex}
                                                            onChange={handleColorChange}
                                                            className='w-6 h-1 cursor-pointer rounded-full border-0 overflow-hidden appearance-none'
                                                            style={{
                                                                background: 'transparent',
                                                            }}
                                                        />
                                                        <div
                                                            onClick={() => colorPickerRef.current?.click()}
                                                            className='absolute inset-0 z-10 cursor-pointer rounded-full shadow-inner border-2 border-gray-200'
                                                            style={{ backgroundColor: hex }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <div onClick={() => setOpenImageConversorDialog(true)} className='select-none cursor-pointer'>
                                        <FaSyncAlt size={13} className='hover:fill-gray-600 fill-black' />
                                    </div>
                                </div>
                            )}
                            <Desktop.WindowHeader>Storage</Desktop.WindowHeader>
                            <Desktop.WindowContent>
                                <Folders.Root className='flex flex-wrap gap-3'>
                                    {!folders.length && (
                                        <div className='absolute inset-0 flex items-center justify-center'>
                                            <TailSpin visible={true} height='80' width='80' color='#8b8b8b' ariaLabel='tail-spin-loading' radius='1' wrapperStyle={{}} wrapperClass='' />
                                        </div>
                                    )}
                                    {folders &&
                                        sortedFolders &&
                                        sortedFolders.map((folder, index) => (
                                            <Folders.Body
                                                hover={folder.name}
                                                key={index}
                                                onClick={() => handleOpenFolder(folder)}
                                                className='p-5 hover:bg-blue-gray-50 w-32 rounded-md text-center relative cursor-pointer'
                                            >
                                                <Folders.Icon hex={folder.hex} />
                                                {folder.private && (
                                                    <Folders.Badge variant='left-bottom'>
                                                        <FaLock className='fill-yellow-400 h-[8px] w-[8px]' />
                                                    </Folders.Badge>
                                                )}
                                                {folder.filesCount != undefined && <Folders.Badge variant='right-bottom'>{folder.filesCount}</Folders.Badge>}
                                                <Folders.Title>{folder.name}</Folders.Title>
                                            </Folders.Body>
                                        ))}
                                </Folders.Root>
                                <div className='absolute left-2 bottom-2 w-[20%] min-w-20'>
                                    <SearchInput input={folderSearch} setInput={setFolderSearch} />
                                </div>
                            </Desktop.WindowContent>
                        </>
                    )}
                    {step === 'FILES' && (
                        <>
                            <div className='absolute top-[30px] right-[5px]'>
                                <OrderMenu actualOrder={fileOrder} onOrder={(newOrder) => setOrderFile(newOrder)} />
                            </div>
                            <div onClick={returnToFolders} className='absolute no-drag top-[6px] z-[999] ml-[8px] cursor-pointer pointer-events-auto'>
                                <FaArrowLeft />
                            </div>
                            {user && user?.role === 'owner' && (
                                <>
                                    <div onClick={() => setOpenUploadDialog(true)} className='absolute h-[20px] no-drag top-[6px] z-[9999] ml-[36px] cursor-pointer pointer-events-auto'>
                                        <FaPlus />
                                    </div>

                                    <div onClick={handleDeleteClick} className='absolute no-drag top-[6px] z-[999] h-[20px] ml-[64px] cursor-pointer pointer-events-auto'>
                                        {confirming ? <FaSquareCheck color='#ffcc00' className='h-4 w-4' /> : <FaTrashCan color='#FF3366' className='h-4 w-4' />}
                                    </div>

                                    <div onClick={toggleSelectionMode} className='absolute no-drag top-[6px] z-[999] h-[20px] ml-[92px] cursor-pointer pointer-events-auto'>
                                        <FaCheck className={`h-4 w-4 ${selectionMode ? 'text-blue-500' : 'text-gray-500'}`} />
                                    </div>

                                    {selectionMode && (
                                        <div className='absolute no-drag top-[30px] z-[999] right-[45px] flex gap-2 cursor-pointer pointer-events-auto bg-white px-2 py-1 rounded-md shadow-sm'>
                                            <button
                                                onClick={selectAllFiles}
                                                className='text-xs flex items-center'
                                                title={selectedFiles.length === (files?.length || 0) ? 'Desmarcar todos' : 'Selecionar todos'}
                                            >
                                                <FaCheck className={`mr-1 h-3 w-3 ${selectedFiles.length === (files?.length || 0) ? 'text-blue-500' : 'text-gray-500'}`} />
                                                {selectedFiles.length === (files?.length || 0) ? 'Desmarcar todos' : 'Selecionar todos'}
                                            </button>

                                            {selectedFiles.length > 0 && (
                                                <button
                                                    onClick={deleteMultipleFiles}
                                                    className='text-xs flex items-center text-red-500 hover:text-red-700'
                                                    title={`Excluir ${selectedFiles.length} arquivo(s)`}
                                                >
                                                    <FaTrashAlt className='mr-1 h-3 w-3' />
                                                    Excluir ({selectedFiles.length})
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                            <Desktop.WindowHeader>{folderTitle}</Desktop.WindowHeader>
                            <Desktop.WindowContent>
                                <Files.Root className='flex flex-wrap gap-3'>
                                    {files &&
                                        sortedFiles &&
                                        sortedFiles.map((object, index) => (
                                            <Files.Body
                                                hover={object.name}
                                                key={index}
                                                onClick={() => openFileDialog(object)}
                                                className='p-5 hover:bg-blue-gray-50 w-32 rounded-md text-center relative cursor-pointer'
                                                selectionMode={selectionMode}
                                                isSelected={selectedFiles.includes(object.id)}
                                                onSelect={() => toggleFileSelection(object.id)}
                                            >
                                                <Files.Icon url={object.url} type={folder?.type} />
                                                {folder?.type && folder.type !== 'video/*' && <Files.Title>{object.name}</Files.Title>}
                                            </Files.Body>
                                        ))}
                                </Files.Root>
                                <div className='fixed left-2 bottom-2 w-[20%] min-w-20'>
                                    <SearchInput input={fileSearch} setInput={setFileSearch} />
                                </div>
                            </Desktop.WindowContent>
                        </>
                    )}

                    {deleteProgressVisible && <DeleteProgress files={fileDeletes} onClose={() => setDeleteProgressVisible(false)} />}
                </Desktop.Window>
            </Desktop.Root>

            {uploadProgressVisible && <UploadProgress files={fileUploads} onClose={() => setUploadProgressVisible(false)} />}

            {hasDelete && (
                <div className='absolute animate-fade-up bg-gray-50 flex flex-col gap-3 border-gray-100 border-1 py-1 px-3 border shadow-lg rounded-lg w-1/2 bottom-5 inset-x-1/4'>
                    <div className='w-full flex items-center justify-between'>
                        <p>Deletando...</p>
                        <div className='flex justify-center items-center'>
                            <div className='w-4 h-4 border-[1px] border-red-500 border-dashed rounded-full animate-spin'></div>
                        </div>
                    </div>
                    <div className='relative flex h-5 w-full overflow-hidden rounded-full bg-gray-200 p-1 shadow-3xl'>
                        <div className='w-full h-full rounded-full overflow-hidden'>
                            <div className='progress relative h-full w-[20%] rounded-full bg-gradient-to-r bg-red-700' />
                        </div>
                    </div>
                </div>
            )}

            <UploadDialog isOpen={openUploadDialog} mimetype={folder?.type} setOpen={setOpenUploadDialog} onClickSubmit={uploadMultipleFiles} setFileNames={setFileNames} fileNames={fileNames} />
            <ContentDialog file={file} folder={folder} isOpen={openContentDialog} setOpen={setOpenContentDialog} deleteFile={deleteFile} />
            <ImageConversorDialog isOpen={openImageConversorDialog} setOpen={setOpenImageConversorDialog} />
        </div>
    );
}
