import { cn } from '@renderer/lib/utils';
import React, { useRef } from 'react';

interface VideoPreviewProps extends React.ComponentProps<"video"> {
    url: string;
}

export function VideoPreview({ url, ...props }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <div
            className={cn("relative bg-gray-800 rounded-md shadow-md overflow-hidden h-20 w-20", props.className)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                src={url}
                className="rounded-md shadow-md w-full h-full object-cover"
                muted
                preload="metadata"
            />
        </div>
    );
}