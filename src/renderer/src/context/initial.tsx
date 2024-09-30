/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

interface LoginDialogContextProps {
    isOpen?: boolean;
    openDialog: () => void;
    closeDialog: () => void;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoginDialogContext = createContext<LoginDialogContextProps>({} as LoginDialogContextProps);

function LoginDialogProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDialog = () => setIsOpen(true);
    const closeDialog = () => setIsOpen(false);

    return (
        <LoginDialogContext.Provider
            value={{
                isOpen,
                closeDialog,
                openDialog,
                setOpen: setIsOpen
            }}
        >
            <>{children}</>
        </LoginDialogContext.Provider>
    );
}

const useLoginDialog = () => {
    const context = useContext(LoginDialogContext);
    return context;
};

export { LoginDialogProvider, useLoginDialog, LoginDialogContext };