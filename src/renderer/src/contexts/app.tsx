import React from 'react';
import { LoginDialogProvider } from './login.dialog';
import { AuthProvider } from './auth';
import { OrderProvider } from './order';
import { ArticleProvider } from './article';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <ArticleProvider>
            <OrderProvider>
                <LoginDialogProvider>
                    <AuthProvider>{children}</AuthProvider>
                </LoginDialogProvider>
            </OrderProvider>
        </ArticleProvider>
    );
}
