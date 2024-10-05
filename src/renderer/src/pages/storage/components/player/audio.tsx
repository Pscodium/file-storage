import { useEffect, useRef } from "react";

export interface VideoPlayerProps extends React.ComponentProps<"audio"> {
    url: string;
}

export default function AudioPlayer({ url, ...props }: VideoPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = url
        }
    }, [url])

    return (
        <audio {...props} controls ref={audioRef}>
            Your browser does not support the audio tag.
        </audio>
    )
}
