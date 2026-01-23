import React from 'react';
import { AboutDialogProvider } from './about.dialog';
import { AuthProvider } from './auth';
import { LoginDialogProvider } from './login.dialog';
import { OrderProvider } from './order';
import { PagesProvider } from './pages';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <PagesProvider>
            <OrderProvider>
                <LoginDialogProvider>
                    <AboutDialogProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </AboutDialogProvider>
                </LoginDialogProvider>
            </OrderProvider>
        </PagesProvider>
    );
}
