import React from 'react';
import { LoginDialogProvider } from './login.dialog';
import { AuthProvider } from './auth';
import { OrderProvider } from './order';
import { ArticleProvider } from './article';
import { ThemeProvider } from './theme';

export function AppProvider({ children }: { children: React.ReactNode }) {
    return (
        <ArticleProvider>
            <ThemeProvider>
                <OrderProvider>
                    <LoginDialogProvider>
                        <AuthProvider>{children}</AuthProvider>
                    </LoginDialogProvider>
                </OrderProvider>
            </ThemeProvider>
        </ArticleProvider>
    );
}
