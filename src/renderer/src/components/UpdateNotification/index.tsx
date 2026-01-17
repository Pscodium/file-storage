import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface UpdateInfo {
    version: string;
    releaseDate?: string;
    releaseNotes?: string;
}

interface DownloadProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}

export function UpdateNotification() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Listener para atualização disponível
        const removeUpdateAvailable = window.api.onUpdateAvailable((info: UpdateInfo) => {
            console.log('Nova versão disponível:', info.version);
            setUpdateInfo(info);
            setUpdateAvailable(true);
        });

        // Listener para progresso do download
        const removeDownloadProgress = window.api.onUpdateDownloadProgress((progress: DownloadProgress) => {
            console.log('Progresso do download:', progress.percent);
            setDownloadProgress(progress);
        });

        // Listener para download completo
        const removeUpdateDownloaded = window.api.onUpdateDownloaded((info: UpdateInfo) => {
            console.log('Atualização baixada:', info.version);
            setDownloading(false);
            setUpdateDownloaded(true);
        });

        // Listener para erros
        const removeUpdateError = window.api.onUpdateError((errorMsg: string) => {
            console.error('Erro na atualização:', errorMsg);
            setError(errorMsg);
            setDownloading(false);
        });

        return () => {
            removeUpdateAvailable();
            removeDownloadProgress();
            removeUpdateDownloaded();
            removeUpdateError();
        };
    }, []);

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);
        const result = await window.api.downloadUpdate();
        if (!result.success) {
            setError(result.error || 'Erro ao baixar atualização');
            setDownloading(false);
        }
    };

    const handleInstall = () => {
        window.api.installUpdate();
    };

    const handleDismiss = () => {
        setUpdateAvailable(false);
        setUpdateInfo(null);
    };

    const handleDismissError = () => {
        setError(null);
    };

    const handleDismissDownloaded = () => {
        setUpdateDownloaded(false);
    };

    return (
        <>
            {/* Dialog para atualização disponível */}
            <Dialog open={updateAvailable && !downloading && !updateDownloaded} onOpenChange={handleDismiss}>
                <DialogContent className='sm:max-w-[425px] bg-white'>
                    <DialogHeader>
                        <DialogTitle>Nova Versão Disponível</DialogTitle>
                        <DialogDescription>Uma nova versão ({updateInfo?.version}) está disponível para download.</DialogDescription>
                    </DialogHeader>
                    {updateInfo?.releaseNotes && (
                        <div className='py-4'>
                            <h4 className='mb-2 text-sm font-semibold'>Novidades:</h4>
                            <div
                                className='prose prose-sm max-h-40 overflow-y-auto'
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    const anchor = target.closest('a') as HTMLAnchorElement | null;
                                    if (anchor && anchor.href) {
                                        e.preventDefault();
                                        window.api.openExternal(anchor.href);
                                    }
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(updateInfo.releaseNotes, {
                                        USE_PROFILES: { html: true },
                                    }),
                                }}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant='outline' onClick={handleDismiss}>
                            Agora não
                        </Button>
                        <Button onClick={handleDownload}>Baixar Atualização</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para progresso do download */}
            <Dialog open={downloading} onOpenChange={() => {}}>
                <DialogContent className='sm:max-w-[425px] bg-white'>
                    <DialogHeader>
                        <DialogTitle>Baixando Atualização</DialogTitle>
                        <DialogDescription>Por favor, aguarde enquanto a atualização é baixada...</DialogDescription>
                    </DialogHeader>
                    {downloadProgress && (
                        <div className='py-4'>
                            <div className='w-full bg-secondary rounded-full h-2.5 mb-4'>
                                <div className='bg-primary h-2.5 rounded-full transition-all duration-300' style={{ width: `${downloadProgress.percent}%` }}></div>
                            </div>
                            <div className='text-sm text-center text-muted-foreground'>
                                {downloadProgress.percent.toFixed(1)}% - {(downloadProgress.transferred / 1024 / 1024).toFixed(2)} MB de {(downloadProgress.total / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div className='text-xs text-center text-muted-foreground mt-1'>{(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s</div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog para atualização baixada */}
            <Dialog open={updateDownloaded} onOpenChange={handleDismissDownloaded}>
                <DialogContent className='sm:max-w-[425px] bg-white'>
                    <DialogHeader>
                        <DialogTitle>Atualização Pronta</DialogTitle>
                        <DialogDescription>A atualização foi baixada com sucesso. Deseja instalar agora?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='outline' onClick={handleDismissDownloaded}>
                            Instalar Depois
                        </Button>
                        <Button onClick={handleInstall}>Instalar e Reiniciar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog para erros */}
            <Dialog open={!!error} onOpenChange={handleDismissError}>
                <DialogContent className='sm:max-w-[425px] bg-white'>
                    <DialogHeader>
                        <DialogTitle>Erro na Atualização</DialogTitle>
                        <DialogDescription>Ocorreu um erro ao tentar atualizar o aplicativo.</DialogDescription>
                    </DialogHeader>
                    <div className='py-4 text-sm text-destructive'>{error}</div>
                    <DialogFooter>
                        <Button onClick={handleDismissError}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
