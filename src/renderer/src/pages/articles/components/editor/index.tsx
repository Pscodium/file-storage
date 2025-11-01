import React, { useEffect } from 'react';
import MDEditor, { ICommand } from '@uiw/react-md-editor';
import '@renderer/assets/markdown-editor.css';
import '@renderer/assets/markdown-preview.css';
import { useArticle } from '@renderer/contexts/article';
import { useTheme } from '@renderer/contexts/theme';

const codePreview: ICommand = {
    name: 'removed',
    keyCommand: 'removed',
    value: 'removed',
};

export default function EditorDocs() {
    const [viewHeight, setViewHeight] = React.useState(0);
    const { newSubSection, setNewSubSection, previewMode } = useArticle();
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
        <div className='w-full h-full relative'>
            <div className='absolute w-full py-4 px-4 h-10 left-0 z-999'>
                {previewMode ? (
                    <h1 className='mb-6 text-6xl font-bold text-balance'>{newSubSection?.title}</h1>
                ) : (
                    <input
                        className='w-full h-20 py-2 px-4 border-none rounded-md resize-none text-6xl font-bold text-foreground outline-none'
                        placeholder='Type a title for the article...'
                        value={newSubSection?.title ?? ''}
                        onChange={(ev) => setNewSubSection((prev) => (prev ? { ...prev, title: ev.currentTarget.value } : prev))}
                    />
                )}
            </div>
            <div data-color-mode={theme} className='flex h-full items-end pb-[34px]'>
                <MDEditor
                    visibleDragbar={false}
                    className='w-full h-full'
                    value={newSubSection?.message ?? ''}
                    hideToolbar={previewMode ? true : false}
                    height={viewHeight - 200}
                    onChange={(value) => setNewSubSection((prev) => (prev ? { ...prev, message: value ?? '' } : prev))}
                    preview={previewMode ? 'preview' : 'edit'}
                    extraCommands={[codePreview]}
                />
            </div>
        </div>
    );
}
