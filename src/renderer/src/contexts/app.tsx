import React from 'react';
import { LoginDialogProvider } from './login.dialog';
import { AuthProvider } from './auth';
import { OrderProvider } from './order';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <OrderProvider>
            <LoginDialogProvider>
                <AuthProvider>{children}</AuthProvider>
            </LoginDialogProvider>
        </OrderProvider>
    );
}
