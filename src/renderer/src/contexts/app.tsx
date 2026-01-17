import React from 'react';
import { AboutDialogProvider } from './about.dialog';
import { AuthProvider } from './auth';
import { LoginDialogProvider } from './login.dialog';
import { OrderProvider } from './order';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <OrderProvider>
            <LoginDialogProvider>
                <AboutDialogProvider>
                    <AuthProvider>{children}</AuthProvider>
                </AboutDialogProvider>
            </LoginDialogProvider>
        </OrderProvider>
    );
}
