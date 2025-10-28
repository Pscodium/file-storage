import React, { createContext, useContext, useState } from 'react';

interface ArticleContextProps {
    isOpen?: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ArticleContext = createContext<ArticleContextProps>({} as ArticleContextProps);

function ArticleProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ArticleContext.Provider
            value={{
                isOpen,
                setIsOpen,
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
