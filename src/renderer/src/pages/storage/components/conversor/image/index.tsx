import React, { useState, createContext, useContext, ReactNode } from 'react';

type ImageConversorContextType = {
    imageContent: string;
    setImageContent: React.Dispatch<React.SetStateAction<string>>;
    outputUrl: string;
    setOutputUrl: React.Dispatch<React.SetStateAction<string>>;
    width: number;
    setWidth: React.Dispatch<React.SetStateAction<number>>;
    height: number;
    setHeight: React.Dispatch<React.SetStateAction<number>>;
    inputFormat: string;
    setInputFormat: React.Dispatch<React.SetStateAction<string>>;
    outputFormat: string;
    setOutputFormat: React.Dispatch<React.SetStateAction<string>>;
    convertImage: () => void;
};

const ImageConversorContext = createContext<ImageConversorContextType | undefined>(undefined);

const useImageConversor = () => {
    const context = useContext(ImageConversorContext);
    if (!context) {
        throw new Error('useImageConversor deve ser usado dentro do ImageConversor.ContextProvider');
    }
    return context;
};

type RootProps = {
    children: ReactNode;
};

const ImageConversor = ({ children }: RootProps) => {
    return <div className='p-8 bg-gray-100'>{children}</div>;
};

ImageConversor.Root = ({ children }: RootProps) => {
    const [imageContent, setImageContent] = useState<string>('');
    const [outputUrl, setOutputUrl] = useState<string>('');
    const [width, setWidth] = useState<number>(500);
    const [height, setHeight] = useState<number>(500);
    const [inputFormat, setInputFormat] = useState<string>('svg');
    const [outputFormat, setOutputFormat] = useState<string>('png');

    const convertImage = () => {
        console.log('entra aqui também: ', imageContent);
        const canvas = document.createElement('canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.src = imageContent;

            img.onload = () => {
                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const convertedImage = canvas.toDataURL(`image/${outputFormat}`);
                setOutputUrl(convertedImage);
            };
        }
    };

    return (
        <ImageConversorContext.Provider
            value={{
                imageContent,
                setImageContent,
                outputUrl,
                setOutputUrl,
                width,
                setWidth,
                height,
                setHeight,
                inputFormat,
                setInputFormat,
                outputFormat,
                setOutputFormat,
                convertImage,
            }}
        >
            {children}
        </ImageConversorContext.Provider>
    );
};

ImageConversor.FormatSelector = () => {
    const { inputFormat, setInputFormat } = useImageConversor();
    const formats = ['svg', 'png', 'jpeg'];

    return (
        <div className='mb-4'>
            <label className='block text-gray-700'>Formato de entrada:</label>
            <select value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} className='mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm p-2'>
                {formats.map((format) => (
                    <option key={format} value={format}>
                        {format.toUpperCase()}
                    </option>
                ))}
            </select>
        </div>
    );
};

ImageConversor.FormatOutputSelector = () => {
    const { outputFormat, setOutputFormat } = useImageConversor();
    const formats = ['png', 'jpeg'];

    return (
        <div className='mb-4'>
            <label className='block text-gray-700'>Formato de saída:</label>
            <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className='mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm p-2'>
                {formats.map((format) => (
                    <option key={format} value={format}>
                        {format.toUpperCase()}
                    </option>
                ))}
            </select>
        </div>
    );
};

ImageConversor.SizeControl = () => {
    const { width, height, setWidth, setHeight } = useImageConversor();

    return (
        <div className='mb-4'>
            <label className='block text-gray-700'>Tamanho da imagem:</label>
            <div className='flex space-x-2'>
                <input
                    type='number'
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                    className='mt-1 block w-1/2 bg-white border border-gray-300 rounded-md shadow-sm p-2'
                    placeholder='Largura'
                />
                <input
                    type='number'
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                    className='mt-1 block w-1/2 bg-white border border-gray-300 rounded-md shadow-sm p-2'
                    placeholder='Altura'
                />
            </div>
        </div>
    );
};

ImageConversor.ImageUploader = () => {
    const { setImageContent, height, width, inputFormat } = useImageConversor();

    const handleImageUrl = (url) => {
        if (inputFormat.toLocaleLowerCase() === 'svg') {
            fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/proxy?url=${encodeURIComponent(url)}`)
                .then((response) => response.blob())
                .then((svgContent) => {
                    console.log('aqui ', svgContent);
                    const img = new Image();
                    const svgBlob = new Blob([svgContent], { type: svgContent.type });
                    const url = URL.createObjectURL(svgBlob);

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0);

                        const pngDataUrl = canvas.toDataURL('image/png');
                        setImageContent(pngDataUrl);
                        URL.revokeObjectURL(url);
                    };

                    img.src = url;
                })
                .catch((error) => console.error('Erro ao carregar imagem', error));

            return;
        }
        fetch(url)
            .then((response) => response.blob())
            .then((blob) => {
                const reader = new FileReader();
                reader.onload = () => setImageContent(reader.result as string);
                reader.readAsDataURL(blob);
            })
            .catch((error) => console.error('Erro ao carregar imagem', error));

        return;
    };

    const handleImageFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImageContent(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className='mb-4'>
            <label className='block text-gray-700'>Carregar Imagem:</label>
            <input
                type='text'
                placeholder='Insira o URL da imagem'
                onBlur={(e) => handleImageUrl(e.target.value)}
                className='mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm p-2 mb-2'
            />
            <input type='file' accept='image/*' onChange={handleImageFileUpload} className='mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm p-2' />
        </div>
    );
};

ImageConversor.ConvertButton = () => {
    const { convertImage } = useImageConversor();

    return (
        <button onClick={convertImage} className='mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition'>
            Converter Imagem
        </button>
    );
};

ImageConversor.ImageConverted = () => {
    const { outputUrl, outputFormat } = useImageConversor();

    return outputUrl ? (
        <div className='mt-4'>
            <h3 className='text-gray-700'>Imagem Convertida:</h3>
            <img src={outputUrl} alt='Imagem Convertida' className='max-w-full border border-gray-300 rounded-md shadow-sm' />
            <a href={outputUrl} download={`${Date.now()}.${outputFormat}`} className='block mt-2 text-blue-600 hover:text-blue-800 underline'>
                Baixar Imagem
            </a>
        </div>
    ) : null;
};

export default ImageConversor;
export { useImageConversor };
