import React, { createContext, useContext, useState } from 'react';

interface AboutDialogContextProps {
    isOpen?: boolean;
    openDialog: () => void;
    closeDialog: () => void;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AboutDialogContext = createContext<AboutDialogContextProps>({} as AboutDialogContextProps);

function AboutDialogProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => setIsOpen(true);
    const closeDialog = () => setIsOpen(false);

    return (
        <AboutDialogContext.Provider
            value={{
                isOpen,
                closeDialog,
                openDialog,
                setOpen: setIsOpen,
            }}
        >
            <>{children}</>
        </AboutDialogContext.Provider>
    );
}

const useAboutDialog = () => {
    const context = useContext(AboutDialogContext);
    return context;
};

export { AboutDialogContext, AboutDialogProvider, useAboutDialog };
