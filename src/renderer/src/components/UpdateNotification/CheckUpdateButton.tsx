import { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

/**
 * Componente opcional para adicionar um botão manual de verificação de atualizações
 * Pode ser adicionado em configurações ou menu do aplicativo
 */
export function CheckUpdateButton() {
    const [checking, setChecking] = useState(false);
    const { toast } = useToast();

    const handleCheckUpdate = async () => {
        setChecking(true);

        try {
            const result = await window.api.checkForUpdates();

            if (result.success) {
                if (result.updateInfo) {
                    toast({
                        title: 'Atualização Disponível',
                        description: `Nova versão ${result.updateInfo.version} disponível!`,
                    });
                } else {
                    toast({
                        title: 'Sem Atualizações',
                        description: 'Você já está usando a versão mais recente.',
                    });
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: result.error || 'Erro ao verificar atualizações',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Erro ao verificar atualizações',
            });
        } finally {
            setChecking(false);
        }
    };

    return (
        <Button onClick={handleCheckUpdate} disabled={checking} variant='outline'>
            {checking ? 'Verificando...' : 'Verificar Atualizações'}
        </Button>
    );
}
