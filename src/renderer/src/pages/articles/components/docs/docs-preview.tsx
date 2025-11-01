import React, { useEffect } from 'react';
import MDEditor, { ICommand } from '@uiw/react-md-editor';
import '@renderer/assets/markdown-editor.css';
import '@renderer/assets/markdown-preview.css';
import { Article } from '../../types/IArticle';
import { useTheme } from '@renderer/contexts/theme';

const codePreview: ICommand = {
    name: 'removed',
    keyCommand: 'removed',
    value: 'removed',
};

interface DocsPreviewProps {
    article: Article;
}

export default function DocsPreview({ article }: DocsPreviewProps) {
    const [viewHeight, setViewHeight] = React.useState(0);
    const { theme } = useTheme();

    useEffect(() => {
        setViewHeight(window.innerHeight);

        function handleResize() {
            setViewHeight(window.innerHeight);
        }

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div>
            <div data-color-mode={theme} className='flex  h-full' style={{ height: viewHeight - 200 }}>
                <MDEditor visibleDragbar={false} className='w-full h-full' value={article.content} hideToolbar={true} height={`100%`} preview={'preview'} extraCommands={[codePreview]} />
            </div>
        </div>
    );
}
