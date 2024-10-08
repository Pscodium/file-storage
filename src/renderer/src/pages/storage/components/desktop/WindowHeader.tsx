import { ElectronAPI } from "@electron-toolkit/preload";
import { IoClose, IoReorderTwo, IoRemoveOutline } from "react-icons/io5";

interface ElectronWindow extends ElectronAPI {
    controlWindow?: (event: 'close' | 'minimize' | 'maximize') => void;
}

export default function WindowHeader({ children }: { children: string }) {
    const _window: ElectronWindow = window.electron;

    return (
        <div className='bg-gray-200 top-0 fixed z-[998] w-full h-7 flex items-center justify-center'>
            <div className='absolute right-2 top-[6px] flex flex-row gap-2'>
                <button 
                    onClick={() => _window.controlWindow?.('minimize')} 
                    className='h-4 w-4 no-drag rounded-full bg-[#FFC331] cursor-pointer flex items-center justify-center'
                >
                    <IoRemoveOutline className='transition-opacity duration-300 opacity-0 hover:opacity-100 fill-[#FFC331]' />
                </button>
                <button 
                    onClick={() => _window.controlWindow?.('maximize')} 
                    className='h-4 w-4 no-drag rounded-full bg-[#24CB3C] cursor-pointer flex items-center justify-center'
                >
                    <IoReorderTwo className='transition-opacity duration-300 opacity-0 hover:opacity-100 fill-[#10661d]' />
                </button>
                <button 
                    onClick={() => _window.controlWindow?.('close')} 
                    className='h-4 w-4 no-drag rounded-full bg-[#FF6259] cursor-pointer flex items-center justify-center'
                >
                    <IoClose className='transition-opacity duration-300 opacity-0 hover:opacity-100 fill-[#83322e]' />
                </button>
            </div>
            <div>{children}</div>
        </div>
    );
}