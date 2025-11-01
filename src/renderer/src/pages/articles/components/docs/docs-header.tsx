'use client';

import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { useTheme } from '@renderer/contexts/theme';
import { Search, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

export function DocsHeader() {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <header className='sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60'>
            <div className='flex flex-1 items-center gap-4'>
                <h1 className='text-lg font-semibold'>Documentation</h1>

                <div className='relative hidden flex-1 md:block md:max-w-md'>
                    <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input type='search' placeholder='Search documentation...' className='w-full pl-8' />
                </div>
            </div>

            <Button variant='ghost' size='icon' onClick={toggleTheme} aria-label='Toggle theme'>
                {theme === 'light' ? <Moon className='h-5 w-5' /> : <Sun className='h-5 w-5' />}
            </Button>
        </header>
    );
}
