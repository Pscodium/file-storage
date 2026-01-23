import React, { createContext, useContext, useState } from 'react';

interface PagesContextProps {
    openedPage: PagesType;
    setOpenedPage: (page: PagesType) => void;
}

const PagesContext = createContext<PagesContextProps>({} as PagesContextProps);
function PagesProvider({ children }: { children: React.ReactNode }) {
    const [openedPage, setOpenedPage] = useState<PagesType>('storage');

    return (
        <PagesContext.Provider
            value={{
                openedPage,
                setOpenedPage,
            }}
        >
            <>{children}</>
        </PagesContext.Provider>
    );
}

const usePages = () => {
    const context = useContext(PagesContext);
    return context;
};

export { PagesProvider, usePages, PagesContext };
