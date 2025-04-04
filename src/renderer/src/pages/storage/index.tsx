/* eslint-disable @typescript-eslint/no-empty-interface */
import { useEffect, useRef, useState } from 'react';
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
import { IoSend } from 'react-icons/io5';
import { FaSyncAlt } from 'react-icons/fa';
import randomColor from 'randomcolor';
import { FaLock, FaUnlock } from 'react-icons/fa6';
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@renderer/components/ui/select';
import { TailSpin } from 'react-loader-spinner';
import ImageConversorDialog from './components/dialog/imageConversor';
import SearchInput from './components/search';
import { OrderMenu } from '@renderer/components/SortMenu';
import { useOrder } from '@renderer/contexts/order';
import { Switch } from '@renderer/components/ui/switch';

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
    const [fileName, setFileName] = useState<string | undefined>();
    const [uploadPercentage, setUploadPercentage] = useState(0);
    const [hasDelete, setHasDelete] = useState(false);
    const [hasUpload, setHasUpload] = useState(false);
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

    function updateUploadPercentage(percentage: number) {
        setUploadPercentage(percentage);
    }

    async function uploadFileSubmit(file: File | undefined) {
        try {
            if (!file || !folder) return;
            setOpenUploadDialog(false);
            setHasUpload(true);

            const uploaded = await apiService.uploadFile(file, folder.id, updateUploadPercentage, fileName);

            if (uploaded) {
                toast({
                    variant: 'destructive',
                    title: 'SUCESSO',
                    description: 'O arquivo foi enviado com sucesso',
                    className: 'outline-none border-none bg-green-600 text-white',
                });
                setHasUpload(false);
                setUploadPercentage(0);
                handleSubmitFile();
            }
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'ERRO',
                description: 'Erro ao tentar enviar o arquivo',
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
            // setStep('FOLDERS');
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

    async function handleSubmitFile() {
        // setStep('FOLDERS')
        const newFolders = await getFolders();
        if (folder && newFolders) {
            const foundFolder = newFolders.find((f) => f.id === folder?.id);
            if (foundFolder) {
                handleOpenFolder(foundFolder);
                setStep('FILES');
            }
        }
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
                            <div onClick={returnToFolders} className='absolute no-drag top-[6px] z-[999] ml-2 cursor-pointer pointer-events-auto'>
                                <FaArrowLeft />
                            </div>
                            {user && user?.role === 'owner' && (
                                <>
                                    <div onClick={() => setOpenUploadDialog(true)} className='absolute h-[20px] no-drag top-[6px] z-[9999] ml-9 cursor-pointer pointer-events-auto'>
                                        <FaPlus />
                                    </div>
                                    <div onClick={handleDeleteClick} className='absolute no-drag top-[6px] z-[999] h-[20px] ml-[70px] cursor-pointer pointer-events-auto'>
                                        {confirming ? <FaSquareCheck color='#ffcc00' className='h-4 w-4' /> : <FaTrashCan color='#FF3366' className='h-4 w-4' />}
                                    </div>
                                </>
                            )}
                            <Desktop.WindowHeader>{folderTitle}</Desktop.WindowHeader>
                            <Desktop.WindowContent>
                                <Files.Root className='flex flex-wrap gap-3'>
                                    {files &&
                                        sortedFiles &&
                                        sortedFiles.map((object, index) => (
                                            <Files.Body
                                                onClick={() => openFileDialog(object)}
                                                hover={object.name}
                                                key={index}
                                                className='p-5 hover:bg-blue-gray-50 w-32 rounded-md text-center relative cursor-pointer'
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
                </Desktop.Window>
            </Desktop.Root>
            {hasUpload && (
                <div className='absolute animate-fade-up bg-gray-50 flex flex-col gap-3 border-gray-100 border-1 py-1 px-3 border shadow-lg rounded-lg w-1/2 bottom-5 inset-x-1/4'>
                    <div className='w-full flex items-center justify-between'>
                        <p>
                            Uploading... <b>{uploadPercentage}%</b>
                        </p>
                        <div className='flex justify-center items-center'>
                            <div className='w-4 h-4 border-[1px] border-blue-500 border-dashed rounded-full animate-spin'></div>
                        </div>
                    </div>
                    <div className='relative flex h-5 w-full overflow-hidden rounded-full bg-gray-200 p-1 shadow-3xl'>
                        <div className={'relative h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-blue-950'} style={{ width: `${uploadPercentage}%` }} />
                    </div>
                </div>
            )}
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
            <UploadDialog isOpen={openUploadDialog} mimetype={folder?.type} setOpen={setOpenUploadDialog} onClickSubmit={uploadFileSubmit} fileName={fileName} setFileName={setFileName} />
            <ContentDialog file={file} folder={folder} isOpen={openContentDialog} setOpen={setOpenContentDialog} deleteFile={deleteFile} />
            <ImageConversorDialog isOpen={openImageConversorDialog} setOpen={setOpenImageConversorDialog} />
        </div>
    );
}
