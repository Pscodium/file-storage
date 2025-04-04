/* eslint-disable prettier/prettier */
import { cn } from "@renderer/lib/utils";
import { cva } from "class-variance-authority";

export interface BadgeProps {
    children: number | React.ReactNode;
    variant: 'right-bottom' | 'left-bottom';
}

export default function Badge({ children, variant }: BadgeProps) {
    const toastVariants = cva(' select-none rounded-full p-1 h-4 flex items-center text-center justify-center absolute right-10 top-9', {
        variants: {
            variant: {
                'right-bottom': 'right-10 top-9 bg-gray-400',
                'left-bottom': 'right-[70px] top-9 bg-white w-4',
            },
        },
        defaultVariants: {
            variant: 'right-bottom',
        },
    });

    return (
        <div className={cn(toastVariants({ variant }))}>
            <p className='text-white font-bold text-sm'>{children}</p>
        </div>
    );
}
