import { ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@renderer/components/ui/dropdown-menu';

interface OrderMenuProps {
    onOrder: (opcao: OrderOptions) => void;
    actualOrder: OrderOptions;
}

export function OrderMenu({ onOrder, actualOrder }: OrderMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className='p-1'>
                    <ArrowUpDown className='h-5 w-5 stroke-gray-400' />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-[200px] z-50 bg-background'>
                <DropdownMenuRadioGroup value={actualOrder} onValueChange={(value) => onOrder(value as OrderOptions)}>
                    <DropdownMenuRadioItem className='cursor-pointer hover:bg-background/80 bg-background' value='date-ascending'>
                        Data (mais antiga)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem className='cursor-pointer hover:bg-background/80 bg-background' value='date-descending'>
                        Data (mais recente)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem className='cursor-pointer hover:bg-background/80 bg-background' value='name-alphabetical'>
                        Nome (A-Z)
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem className='cursor-pointer hover:bg-background/80 bg-background' value='name-reverse-alphabetical'>
                        Nome (Z-A)
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
