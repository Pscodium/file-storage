import { useRef, useState } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

export function AudioPreview({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const handleMouseEnter = () => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div 
            className="flex items-center" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <audio ref={audioRef} src={url} preload="metadata" />
            <button className="flex items-center justify-center">
                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
        </div>
    );
}