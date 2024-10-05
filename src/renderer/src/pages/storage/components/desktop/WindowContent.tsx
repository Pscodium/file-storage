import React from 'react';

interface WindowProps {
    children: React.ReactNode;
}

export default function WindowContent({ children }: WindowProps) {
    return (
        <div className='p-5'>
            {children}
        </div>
    );
}