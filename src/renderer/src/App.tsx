import { BiLogOut, BiSolidDoorOpen } from 'react-icons/bi';
import LoginDialog from './components/Dialog/Login';
import { Toaster } from './components/ui/toaster';
import { UpdateNotification } from './components/UpdateNotification';
import { useAuth } from './contexts/auth';
import { useLoginDialog } from './contexts/login.dialog';
import Storage from './pages/storage';

export default function App(): JSX.Element {
    const { openDialog } = useLoginDialog();
    const { user, Logout } = useAuth();

    return (
        <div className='h-screen flex flex-col items-center justify-center gap-2'>
            <Storage />
            {user ? (
                <div className='fixed right-2 bottom-2 cursor-pointer' onClick={Logout}>
                    <BiLogOut size={23} className='fill-gray-400' />
                </div>
            ) : (
                <div className='fixed right-2 bottom-2 cursor-pointer' onClick={openDialog}>
                    <BiSolidDoorOpen size={23} className='fill-gray-400' />
                </div>
            )}
            <LoginDialog />
            <UpdateNotification />
            <Toaster />
        </div>
    );
}
