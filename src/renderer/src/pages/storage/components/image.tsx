import React, { useEffect, useState } from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    source?: string | null;
}

export default function Image(props: ImageProps) {
    const [source, setSource] = useState('');
    const IMAGE_ERROR = "https://bucket-aws-images-forum.s3.us-east-2.amazonaws.com/no-image.png";

    function loadFallback() {
        setSource(IMAGE_ERROR);
    }

    useEffect(() => {
        if (props.source) {
            setSource(props.source);
            return;
        }
        setSource(IMAGE_ERROR);
    }, [props.source]);

    return (
        <div>
            {source && (
                <div className={props.className}>
                    <img className='select-none' {...props} src={source} onError={loadFallback} />
                </div>
            )}
        </div>
    );
}