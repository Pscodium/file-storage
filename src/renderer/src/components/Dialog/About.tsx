import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@renderer/components/ui/dialog';
import { useAboutDialog } from '@renderer/contexts/about.dialog';
import { useEffect, useState } from 'react';

interface AppInfo {
    name: string;
    version: string;
    author: string;
    description: string;
}

interface Changelog {
    version: string;
    date: string;
    changes: string[];
}

export default function AboutDialog() {
    const { setOpen, isOpen } = useAboutDialog();
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [changelogs, setChangelogs] = useState<Changelog[]>([]);

    useEffect(() => {
        // Carregar informações do app
        window.api.getAppInfo().then(setAppInfo);
        window.api.getChangelogs().then(setChangelogs);
    }, []);

    if (!appInfo) {
        return null;
    }

    // Formatar data
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const buildDate = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto bg-white'>
                <DialogTitle className='text-2xl font-bold mb-2'>{appInfo.name}</DialogTitle>
                <DialogDescription asChild>
                    <div className='space-y-6'>
                        {/* Informações principais */}
                        <div className='space-y-2 border-b pb-4'>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-500'>Versão:</span>
                                <span className='font-semibold text-base'>{appInfo.version}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-500'>Autor:</span>
                                <span className='font-medium text-sm'>{appInfo.author}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm text-gray-500'>Data de Build:</span>
                                <span className='font-medium text-sm'>{buildDate}</span>
                            </div>
                        </div>

                        {/* Changelogs */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-900'>Histórico de Versões</h3>
                            {changelogs.map((changelog) => (
                                <div key={changelog.version} className='space-y-2 border-l-2 border-blue-500 pl-4'>
                                    <div className='flex items-baseline gap-2'>
                                        <span className='font-semibold text-base'>v{changelog.version}</span>
                                        <span className='text-xs text-gray-500'>{formatDate(changelog.date)}</span>
                                    </div>
                                    <ul className='space-y-1 list-disc list-inside'>
                                        {changelog.changes.map((change, index) => (
                                            <li key={index} className='text-sm text-gray-600'>
                                                {change}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Informações adicionais */}
                        <div className='text-xs text-gray-500 text-center pt-4 border-t'>
                            <p>© 2026 {appInfo.author}. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
