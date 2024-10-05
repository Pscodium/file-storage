export interface VideoPlayerProps {
    url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
    return (
        <video className="h-full w-full rounded-lg" controls loop>
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
    )
}
