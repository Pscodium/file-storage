'use client';

import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Button } from '@renderer/components/ui/button';
import { Article, Category } from '../../types/IArticle';

interface DocsSidebarProps {
    categories: Category[];
    selectedArticle: Article | null;
    onSelectArticle: (article: Article) => void;
    isLoading: boolean;
    // optional resizer props
    sidebarWidth?: number;
    setSidebarWidth?: (w: number) => void;
}

export function DocsSidebar({ categories, selectedArticle, onSelectArticle, isLoading, sidebarWidth = 256, setSidebarWidth }: DocsSidebarProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

    const isDraggingRef = { current: false } as { current: boolean };

    const startDrag = (e: React.MouseEvent) => {
        if (!setSidebarWidth) return;
        isDraggingRef.current = true;
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const onMouseMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dx = ev.clientX - startX;
            const newWidth = Math.min(Math.max(startWidth + dx, 200), 520);
            setSidebarWidth(newWidth);
        };

        const onMouseUp = () => {
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
        else newExpanded.add(categoryId);
        setExpandedCategories(newExpanded);
    };

    const toggleSubcategory = (key: string) => {
        const newExpanded = new Set(expandedSubcategories);
        if (newExpanded.has(key)) newExpanded.delete(key);
        else newExpanded.add(key);
        setExpandedSubcategories(newExpanded);
    };

    if (isLoading) {
        return (
            <div className='flex h-full flex-col gap-2 p-4'>
                <Skeleton className='h-8 w-full' />
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-6 w-full' />
                <Skeleton className='h-6 w-2/3' />
                <Skeleton className='h-6 w-full' />
            </div>
        );
    }

    return (
        // Bind the visible width of the sidebar to the `sidebarWidth` prop so the
        // inner content (flex children) can reflow responsively while dragging.
        // Use `box-border` so padding is included in the width calculation.
        <ScrollArea className='h-full relative overflow-hidden box-border' style={{ width: `${sidebarWidth}px` }}>
            <div className='flex flex-col gap-1 p-4 pt-16 pr-4 md:pt-4'>
                {categories.map((category) => {
                    const isCategoryExpanded = expandedCategories.has(category.id);
                    return (
                        <div key={category.id} className='mb-2'>
                            <Button
                                variant='ghost'
                                className='w-full items-center justify-start gap-2 font-semibold min-w-0 px-3 text-left box-border overflow-hidden shrink'
                                onClick={() => toggleCategory(category.id)}
                            >
                                {isCategoryExpanded ? <ChevronDown className='h-4 w-4 flex-none' /> : <ChevronRight className='h-4 w-4 flex-none' />}
                                <span className='flex-1 min-w-0 max-w-full truncate' style={{ maxWidth: sidebarWidth - 100 }}>
                                    {category.title}
                                </span>
                            </Button>

                            {isCategoryExpanded && (
                                <div className='ml-2 mt-1 flex flex-col gap-1'>
                                    {/* Render articles directly under category first */}
                                    {Array.isArray(category.articles) && category.articles.length > 0 && (
                                        <div className='flex flex-col gap-1'>
                                            {category.articles
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((article) => (
                                                    <Button
                                                        key={article.id}
                                                        variant={selectedArticle?.id === article.id ? 'secondary' : 'ghost'}
                                                        className='w-full items-center justify-start gap-2 pl-6 pr-3 text-sm min-w-0 text-left box-border overflow-hidden shrink'
                                                        onClick={() => onSelectArticle(article)}
                                                    >
                                                        <FileText className='h-4 w-4 flex-none' />
                                                        <span className='flex-1 min-w-0 max-w-full truncate' style={{ maxWidth: sidebarWidth - 100 }}>
                                                            {article.title}
                                                        </span>
                                                    </Button>
                                                ))}
                                        </div>
                                    )}

                                    {category.subCategories.map((sub) => {
                                        const subKey = `${category.id}-${sub.id}`;
                                        const isSubExpanded = expandedSubcategories.has(subKey);

                                        return (
                                            <div key={sub.id}>
                                                <Button
                                                    variant='ghost'
                                                    className='w-full items-center justify-start gap-2 pl-4 pr-3 text-sm min-w-0 text-left box-border overflow-hidden shrink'
                                                    onClick={() => toggleSubcategory(subKey)}
                                                >
                                                    {isSubExpanded ? <ChevronDown className='h-4 w-4 flex-none' /> : <ChevronRight className='h-4 w-4 flex-none' />}
                                                    <span className='flex-1 min-w-0 max-w-full truncate' style={{ maxWidth: sidebarWidth - 100 }}>
                                                        {sub.title}
                                                    </span>
                                                </Button>

                                                {isSubExpanded && (
                                                    <div className='ml-4 mt-1 flex flex-col gap-1'>
                                                        {sub.articles
                                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                            .map((article) => (
                                                                <Button
                                                                    key={article.id}
                                                                    variant={selectedArticle?.id === article.id ? 'secondary' : 'ghost'}
                                                                    className='w-full items-center justify-start gap-2 pl-6 pr-3 text-sm min-w-0 text-left box-border overflow-hidden shrink'
                                                                    onClick={() => onSelectArticle(article)}
                                                                >
                                                                    <FileText className='h-4 w-4 flex-none' />
                                                                    {/* Ensure article title truncates and never overflows the button */}
                                                                    <span className='flex-1 min-w-0 max-w-full truncate' style={{ maxWidth: sidebarWidth - 100 }}>
                                                                        {article.title}
                                                                    </span>
                                                                </Button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Resizer handle (click & drag to resize sidebar) */}
            <div className='absolute right-0 top-0 h-full w-2 -mr-1 cursor-col-resize z-40' onMouseDown={startDrag} aria-hidden />
        </ScrollArea>
    );
}
