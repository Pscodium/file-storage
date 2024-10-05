export interface BadgeProps {
    children: number;
}

export default function Badge({ children }: BadgeProps) {
    return (
        <div className='bg-gray-400 select-none rounded-full p-1 h-4 flex items-center text-center justify-center absolute right-10 top-9'>
            <p className='text-white font-bold text-sm'>{children}</p>
        </div>
    );
}