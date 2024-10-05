import { FiLogIn } from 'react-icons/fi';
import { useLoginDialog } from './contexts/login.dialog';
import LoginDialog from './components/Dialog/Login';
import Storage from './pages/storage';
import { Toaster } from './components/ui/toaster';

export default function App(): JSX.Element {
    const { openDialog } = useLoginDialog();

    return (
        <div className='h-screen flex flex-col items-center justify-center gap-2'>
            <Storage />
            <div className='absolute right-2 bottom-2 cursor-pointer' onClick={openDialog}>
                <FiLogIn size={23} />
            </div>
            <LoginDialog />
            <Toaster />
        </div>
    );
}
