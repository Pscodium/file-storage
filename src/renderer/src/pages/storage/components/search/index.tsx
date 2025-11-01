import { CloseIcon } from '@renderer/assets/icons/CloseIcon';
import { Input } from '@renderer/components/ui/input';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';

interface SearchInputProps {
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
}

export default function SearchInput({ input, setInput }: SearchInputProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClickCloseButton = () => {
        if (input.length > 0) {
            setInput('');
            return;
        }
        setIsOpen(false);
    };

    const handleBlurInput = () => {
        if (input.length > 0) {
            return;
        }
        setIsOpen(false);
    };

    return (
        <div>
            {isOpen ? (
                <div onBlur={handleBlurInput} className='search flex w-full overflow-hidden border border-1 border-gray-400 rounded-md'>
                    <Input autoFocus value={input} onChange={(ev) => setInput(ev.target.value)} type='search' className='rounded-none border-none rounded-s-md h-5 py-4 text-[12px] bg-background' />
                    <button onClick={handleClickCloseButton} className='relative w-8 min-h-full bg-gray-400 flex items-center justify-center hover:bg-gray-500'>
                        <CloseIcon className='stroke-white' />
                    </button>
                </div>
            ) : (
                <div className='flex'>
                    <button onClick={() => setIsOpen(true)}>
                        <SearchIcon className='h-5 w-5 stroke-gray-400' />
                    </button>
                </div>
            )}
        </div>
    );
}
