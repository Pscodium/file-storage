import { BiSolidDoorOpen, BiLogOut } from "react-icons/bi";
import { useLoginDialog } from './contexts/login.dialog';
import LoginDialog from './components/Dialog/Login';
import Storage from './pages/storage';
import { Toaster } from './components/ui/toaster';
import { useAuth } from './contexts/auth';

export default function App(): JSX.Element {
    const { openDialog } = useLoginDialog();
    const { user, Logout } = useAuth();

    return (
        <div className='h-screen flex flex-col items-center justify-center gap-2'>
            <Storage />
            {user?
                <div className='absolute right-2 bottom-2 cursor-pointer' onClick={Logout}>
                    <BiLogOut size={23} className='fill-gray-400' />
                </div>
            :
                <div className='absolute right-2 bottom-2 cursor-pointer' onClick={openDialog}>
                    <BiSolidDoorOpen size={23} className='fill-gray-400' />
                </div>
            }
            <LoginDialog />
            <Toaster />
        </div>
    );
}
