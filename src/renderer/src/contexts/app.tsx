import React from 'react';
import { LoginDialogProvider } from './login.dialog';
import { AuthProvider } from './auth';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <LoginDialogProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </LoginDialogProvider>
    )
}
