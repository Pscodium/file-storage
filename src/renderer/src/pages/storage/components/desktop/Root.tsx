import React from 'react';

export interface StorageCardProps extends React.ComponentProps<'div'> {
    children: React.ReactNode;
}

export default function Root({ children, ...props }: StorageCardProps) {
    return (
        <div {...props} className='w-full min-h-screen flex items-end'>
            {children}
        </div>
    );
}