import { useLoginDialog } from "./context/initial";

export default function App(): JSX.Element {
    const ipcHandle = (): void => window.electron.ipcRenderer.send('ping');
    const { setOpen, isOpen } = useLoginDialog();
    console.log('aqui ', isOpen)

    return (
        <div className="h-screen flex flex-col items-center justify-center gap-2">
            <a target='_blank' className="bg-gray-500 p-2 rounded-lg text-white font-bold cursor-pointer" rel='noreferrer' onClick={ipcHandle}>
                Send IPC
            </a>
            <button className="bg-gray-500 p-2 rounded-lg text-white font-bold" onClick={() => setOpen(!isOpen)}>AQUI CLICA</button>

            <text>Aberto: {String(isOpen)}</text>
        </div>
    );
}
