/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog';
import { usePages } from '@renderer/contexts/pages';
import { apiService } from '@renderer/services/api';
import { CalendarClock, Check, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Link2, Loader2, MousePointerClick, Trash } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FaRegFolder } from 'react-icons/fa';
import { Desktop } from './components/desktop';

export default function Shorten(): JSX.Element {
    const { setOpenedPage } = usePages();
    const [url, setUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);
    const [copied, setCopied] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [currentPage, setCurrentPage] = useState(1);
    const [links, setLinks] = useState<ShortenedLink[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; code: string | null }>({ isOpen: false, code: null });

    const fetchLinks = useCallback(async (page: number) => {
        setIsLoadingLinks(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '5',
            });

            const response = await apiService.getShortenedUrls(params);

            setLinks(response.data);
            setTotalPages(response.totalPages);
            setTotalItems(response.totalItems);
        } catch (err) {
            console.error('Erro ao buscar links:', err);
        } finally {
            setIsLoadingLinks(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchLinks(currentPage);
        }
    }, [activeTab, currentPage, fetchLinks]);

    const isValidUrl = (string: string) => {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    };

    const handleShorten = async () => {
        setError('');

        if (!url.trim()) {
            setError('Por favor, insira uma URL');
            return;
        }

        if (!isValidUrl(url)) {
            setError('Por favor, insira uma URL valida');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiService.shortenUrl(url);

            setShortUrl(response.shortUrl);
        } catch (err) {
            setError('Erro ao encurtar URL. Tente novamente.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUserUrl = async (code: string) => {
        try {
            await apiService.deleteUserUrl(code);
            fetchLinks(currentPage);
            setDeleteModal({ isOpen: false, code: null });
        } catch (err) {
            console.error('Erro ao deletar link:', err);
        }
    };

    const handleCopy = async (urlToCopy: string) => {
        await navigator.clipboard.writeText(urlToCopy);
        setCopied(urlToCopy);
        setTimeout(() => setCopied(''), 2000);
    };

    const handleReset = () => {
        setUrl('');
        setShortUrl('');
        setError('');
    };

    const formatDate = (dateNumber: number) => {
        const date = new Date(dateNumber);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const truncateUrl = (url: string, maxLength: number = 35) => {
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    };

    const getExpirationDate = (createdAt: number) => {
        const date = new Date(createdAt);
        date.setDate(date.getDate() + 12);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    return (
        <div className='min-h-screen w-full items-center justify-center'>
            <div className='absolute w-full h-7 drag'>
                <Desktop.Root>
                    <Desktop.Window>
                        <div className='no-drag flex items-center gap-2 absolute h-[20px] top-[8px] z-[999] pointer-events-auto ml-2 cursor-pointer'>
                            <div onClick={() => setOpenedPage('storage')} className='select-none cursor-pointer'>
                                <FaRegFolder size={13} className='hover:fill-gray-600 fill-black' />
                            </div>
                        </div>
                        <Desktop.WindowHeader>URL Shorten</Desktop.WindowHeader>
                        <Desktop.WindowContent>
                            <div className='w-full items-center justify-center bg-background'>
                                <div className='w-1/2 mx-auto flex flex-col gap-6 py-10'>
                                    <header className='text-center space-y-3'>
                                        <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-2'>
                                            <Link2 className='w-8 h-8 text-slate-600' />
                                        </div>
                                        <h1 className='text-3xl font-semibold tracking-tight text-slate-800'>Encurtador de URL</h1>
                                        <p className='text-slate-500 text-balance'>Cole sua URL longa abaixo e obtenha um link curto instantaneamente</p>
                                    </header>
                                    <div className='bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden'>
                                        <div className='flex border-b border-slate-200'>
                                            <button
                                                onClick={() => setActiveTab('create')}
                                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                                    activeTab === 'create' ? 'text-slate-800 border-b-2 border-slate-700 bg-slate-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                Criar Link
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('history')}
                                                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                                                    activeTab === 'history' ? 'text-slate-800 border-b-2 border-slate-700 bg-slate-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                Meus Links
                                                {totalItems > 0 && <span className='ml-2 px-2 py-0.5 text-xs bg-slate-200 text-slate-600 rounded-full'>{totalItems}</span>}
                                            </button>
                                        </div>

                                        <div className='p-6'>
                                            {activeTab === 'create' ? (
                                                <div className='space-y-4'>
                                                    {!shortUrl ? (
                                                        <>
                                                            <div className='space-y-2'>
                                                                <div className='relative'>
                                                                    <input
                                                                        type='url'
                                                                        placeholder='https://exemplo.com/sua-url-muito-longa'
                                                                        value={url}
                                                                        onChange={(e) => {
                                                                            setUrl(e.target.value);
                                                                            setError('');
                                                                        }}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleShorten()}
                                                                        className='w-full h-12 px-4 pr-12 text-base text-slate-700 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-all'
                                                                    />
                                                                    <Link2 className='absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300' />
                                                                </div>
                                                                {error && <p className='text-sm text-red-500'>{error}</p>}
                                                            </div>

                                                            <button
                                                                onClick={handleShorten}
                                                                disabled={isLoading}
                                                                className='w-full h-11 text-base font-medium text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 rounded-lg transition-colors flex items-center justify-center'
                                                            >
                                                                {isLoading ? (
                                                                    <>
                                                                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                                                                        Encurtando...
                                                                    </>
                                                                ) : (
                                                                    'Encurtar URL'
                                                                )}
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className='space-y-4'>
                                                            <div className='text-center space-y-1'>
                                                                <p className='text-sm text-slate-500'>URL encurtada com sucesso!</p>
                                                            </div>

                                                            <div className='flex items-center gap-2'>
                                                                <input
                                                                    readOnly
                                                                    value={shortUrl}
                                                                    className='flex-1 h-12 px-4 text-base font-medium text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg focus:outline-none'
                                                                />
                                                                <button
                                                                    onClick={() => handleCopy(shortUrl)}
                                                                    className='h-12 w-12 shrink-0 flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors'
                                                                >
                                                                    {copied === shortUrl ? <Check className='w-5 h-5 text-teal-500' /> : <Copy className='w-5 h-5 text-slate-500' />}
                                                                </button>
                                                            </div>

                                                            {copied === shortUrl && <p className='text-sm text-center text-teal-600 font-medium'>Link copiado!</p>}

                                                            <button onClick={handleReset} className='w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors'>
                                                                Encurtar outra URL
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className='space-y-4'>
                                                    <div className='h-[280px] overflow-y-auto pr-1 space-y-3'>
                                                        {isLoadingLinks ? (
                                                            <div className='h-full flex items-center justify-center'>
                                                                <Loader2 className='w-6 h-6 text-slate-400 animate-spin' />
                                                            </div>
                                                        ) : links.length > 0 ? (
                                                            links.map((link) => (
                                                                <div key={link.code} className='p-3 rounded-lg border bg-white border-slate-200 hover:border-slate-300 transition-colors'>
                                                                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                                                                        <div className='flex-1 min-w-0'>
                                                                            <a
                                                                                href={link.shortUrl}
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className='text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline break-all'
                                                                            >
                                                                                {link.shortUrl.replace('https://', '')}
                                                                            </a>
                                                                            <div className='relative group'>
                                                                                <p className='text-xs text-slate-500 truncate mt-1 cursor-default'>{truncateUrl(link.original)}</p>
                                                                                <div className='absolute left-0 top-full mt-1 z-10 max-w-xs px-3 py-2 text-xs text-white bg-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 break-all'>
                                                                                    {link.original}
                                                                                    <div className='absolute -top-1 left-4 w-2 h-2 bg-slate-800 rotate-45' />
                                                                                </div>
                                                                            </div>
                                                                            <div className='flex items-center gap-3 mt-2 text-xs text-slate-400'>
                                                                                <span className='flex items-center gap-1'>
                                                                                    <Clock className='w-3 h-3' />
                                                                                    {formatDate(link.createdAt)}
                                                                                </span>
                                                                                <span className='flex items-center gap-1'>
                                                                                    <CalendarClock className='w-3 h-3' />
                                                                                    Expira: {getExpirationDate(link.createdAt)}
                                                                                </span>
                                                                                <span className='flex items-center gap-1'>
                                                                                    <MousePointerClick className='w-3 h-3' />
                                                                                    {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className='flex items-center gap-1 sm:flex-shrink-0'>
                                                                            <button
                                                                                onClick={() => handleCopy(link.shortUrl)}
                                                                                className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors'
                                                                                title='Copiar link'
                                                                            >
                                                                                {copied === link.shortUrl ? <Check className='w-4 h-4 text-teal-500' /> : <Copy className='w-4 h-4' />}
                                                                            </button>
                                                                            <a
                                                                                href={link.shortUrl}
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className='p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors'
                                                                                title='Abrir link'
                                                                            >
                                                                                <ExternalLink className='w-4 h-4' />
                                                                            </a>
                                                                            <button
                                                                                onClick={() => setDeleteModal({ isOpen: true, code: link.code })}
                                                                                className='p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
                                                                                title='Deletar link'
                                                                            >
                                                                                <Trash className='w-4 h-4' />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className='h-full flex items-center justify-center text-slate-400 text-sm'>Nenhum link encontrado</div>
                                                        )}
                                                    </div>
                                                    {totalPages > 1 && (
                                                        <div className='flex items-center justify-between pt-2 border-t border-slate-100'>
                                                            <span className='text-xs text-slate-500'>
                                                                Pagina {currentPage} de {totalPages}
                                                            </span>
                                                            <div className='flex gap-1'>
                                                                <button
                                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                                    disabled={currentPage === 1 || isLoadingLinks}
                                                                    className='p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent rounded transition-colors'
                                                                >
                                                                    <ChevronLeft className='w-4 h-4' />
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                                    disabled={currentPage === totalPages || isLoadingLinks}
                                                                    className='p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent rounded transition-colors'
                                                                >
                                                                    <ChevronRight className='w-4 h-4' />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Desktop.WindowContent>
                    </Desktop.Window>
                </Desktop.Root>

                <Dialog open={deleteModal.isOpen} onOpenChange={(open) => setDeleteModal({ ...deleteModal, isOpen: open })}>
                    <DialogContent className='bg-white'>
                        <DialogHeader>
                            <DialogTitle>Deletar link encurtado?</DialogTitle>
                            <DialogDescription>Esta ação não pode ser desfeita. O link será permanentemente deletado.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className='gap-2 sm:gap-0 gb'>
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, code: null })}
                                className='w-full sm:w-auto px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium'
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => deleteModal.code && handleDeleteUserUrl(deleteModal.code)}
                                className='w-full sm:w-auto px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium'
                            >
                                Deletar
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
