import React, { useEffect, useState } from 'react';

interface WindowProps {
    children: React.ReactNode;
}

export default function WindowContent({ children }: WindowProps) {
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => {
            setWindowHeight(window.innerHeight);
        }

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [])

    return (
        <div className='p-5 overflow-auto' style={{ height: windowHeight - 32 }}>
            {children} 
        </div>
    );
}