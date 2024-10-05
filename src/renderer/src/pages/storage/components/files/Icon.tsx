import { AudioPreview } from "../player/audioPreview";
import { VideoPreview } from "../player/videoPreview";

export interface ArticleCardProps {
    url: string;
    type?: FileTypes;
}

export default function Icon({ url, type }: ArticleCardProps) {
    return (
        <div className='flex items-center justify-center'>
            
                {type && type === 'video/*' && (
                    <div className="h-20 w-20 flex items-center justify-center">
                        <VideoPreview url={url} />
                    </div>
                )}
                {type && type === 'image/*' && (
                    <div className="h-12 w-12 flex items-center justify-center">
                        <img src={url} className='w-full' />
                    </div>
                )}
                {type && type === 'audio/*' && (
                    <div className="h-12 w-12 flex items-center justify-center">
                        <AudioPreview url={url} />
                    </div>
                )}
                {!type && (
                    <div className="h-12 w-12 flex items-center justify-center">
                        <img src={url} className='w-full' />
                    </div>
                )}
        </div>
    );
}