import React, { createContext, useContext, useState } from 'react';

interface ArticleContextProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    newSubSection: NewSubSection | undefined;
    setNewSubSection: React.Dispatch<React.SetStateAction<NewSubSection | undefined>>;
    previewMode: boolean;
    setPreviewMode: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NewSubSection {
    title: string;
    type: 'category' | 'article';
    message?: string;
    categoryId?: string;
    subCategoryId?: string;
    articleEditor?: boolean;
    edit?: boolean;
}

const ArticleContext = createContext<ArticleContextProps>({} as ArticleContextProps);

function ArticleProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [newSubSection, setNewSubSection] = useState<NewSubSection | undefined>({
        title: '',
        type: 'article',
    });
    return (
        <ArticleContext.Provider
            value={{
                isOpen,
                setIsOpen,
                newSubSection,
                setNewSubSection,
                previewMode,
                setPreviewMode,
            }}
        >
            <>{children}</>
        </ArticleContext.Provider>
    );
}

const useArticle = () => {
    const context = useContext(ArticleContext);
    return context;
};

export { ArticleProvider, useArticle, ArticleContext };
