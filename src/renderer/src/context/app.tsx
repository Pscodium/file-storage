import React from 'react';
import { LoginDialogProvider } from './initial';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <LoginDialogProvider>
            {children}
        </LoginDialogProvider>
    );
}