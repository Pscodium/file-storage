import { AiOutlineInfoCircle } from 'react-icons/ai';
import { BiLogOut, BiSolidDoorOpen } from 'react-icons/bi';
import AboutDialog from './components/Dialog/About';
import LoginDialog from './components/Dialog/Login';
import { Toaster } from './components/ui/toaster';
import { UpdateNotification } from './components/UpdateNotification';
import { useAboutDialog } from './contexts/about.dialog';
import { useAuth } from './contexts/auth';
import { useLoginDialog } from './contexts/login.dialog';
import Storage from './pages/storage';
import { usePages } from './contexts/pages';
import Shorten from './pages/shorten';

export default function App(): JSX.Element {
    const { openDialog } = useLoginDialog();
    const { openDialog: openAboutDialog } = useAboutDialog();
    const { user, Logout } = useAuth();
    const { openedPage } = usePages();

    const currentPage = () => {
        switch (openedPage) {
            case 'storage':
                return <Storage />;
            case 'shorten':
                return <Shorten />;
            default:
                return <Storage />;
        }
    };

    return (
        <div className='h-screen flex flex-col items-center justify-center gap-2'>
            {currentPage()}
            {user ? (
                <div className='fixed right-2 bottom-2 cursor-pointer' onClick={Logout}>
                    <BiLogOut size={23} className='fill-gray-400' />
                </div>
            ) : (
                <div className='fixed right-2 bottom-2 cursor-pointer' onClick={openDialog}>
                    <BiSolidDoorOpen size={23} className='fill-gray-400' />
                </div>
            )}
            <div className='fixed left-10 bottom-2 cursor-pointer' onClick={openAboutDialog}>
                <AiOutlineInfoCircle size={20} className='fill-gray-400' />
            </div>
            <LoginDialog />
            <AboutDialog />
            <UpdateNotification />
            <Toaster />
        </div>
    );
}
