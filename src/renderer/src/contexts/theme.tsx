import React, { createContext, useContext, useState } from 'react';

interface ThemeContextProps {
    theme: 'light' | 'dark';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const ThemeContext = createContext<ThemeContextProps>({} as ThemeContextProps);

function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    return (
        <ThemeContext.Provider
            value={{
                theme,
                setTheme,
            }}
        >
            <>{children}</>
        </ThemeContext.Provider>
    );
}

const useTheme = () => {
    const context = useContext(ThemeContext);
    return context;
};

export { ThemeProvider, useTheme, ThemeContext };
