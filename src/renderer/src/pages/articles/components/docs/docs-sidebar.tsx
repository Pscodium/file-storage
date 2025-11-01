/* eslint-disable react/jsx-key */
'use client';

import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { Button } from '@renderer/components/ui/button';
import { Article, Category } from '../../types/IArticle';
import { Input } from '@renderer/components/ui/input';
import { apiService } from '@renderer/services/api';
import { useArticle } from '@renderer/contexts/article';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@renderer/components/ui/context-menu';

interface DocsSidebarProps {
    categories: Category[];
    selectedArticle: Article | null;
    onSelectArticle: (article: Article) => void;
    isLoading: boolean;
    sidebarWidth?: number;
    setSidebarWidth?: (w: number) => void;
    getCategories: () => Promise<void>;
    deleteCallback: (type: 'category' | 'article' | 'sub-category', id: string) => Promise<void>;
}

export function DocsSidebar({ categories, selectedArticle, onSelectArticle, isLoading, sidebarWidth = 256, setSidebarWidth, getCategories, deleteCallback }: DocsSidebarProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
    const [categoryTitle, setCategoryTitle] = useState<string>('');
    const [newCategoryOpen, setNewCategoryOpen] = useState<boolean>(false);
    const [newSubCategoryOpen, setNewSubCategoryOpen] = useState<boolean>(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { setNewSubSection } = useArticle();

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

    const categoryKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && categoryTitle.trim() !== '') {
            await apiService.createCategory(categoryTitle.trim());
            await getCategories();
            setNewCategoryOpen(false);
            setCategoryTitle('');
        } else if (e.key === 'Escape') {
            setNewCategoryOpen(false);
            setCategoryTitle('');
        }
    };

    const subCategoryKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, categoryId: string) => {
        if (e.key === 'Enter' && categoryTitle.trim() !== '') {
            await apiService.createSubCategory(categoryTitle.trim(), categoryId);
            await getCategories();
            setNewSubCategoryOpen(false);
            setCategoryTitle('');
        } else if (e.key === 'Escape') {
            setNewSubCategoryOpen(false);
            setCategoryTitle('');
        }
    };

    const handleClickDelete = async (type: 'category' | 'article' | 'sub-category', id: string) => {
        await deleteCallback(type, id);
    };

    const handleClickNewFile = async (categoryId: string, subCategoryId?: string) => {
        setNewSubSection({ title: '', type: 'article', categoryId, subCategoryId, articleEditor: true, edit: false });
    };

    const handleClickUpdate = async (article: Article) => {
        setNewSubSection({ title: article.title, message: article.content, type: 'article', articleEditor: true, edit: true });
    };

    return (
        // Bind the visible width of the sidebar to the `sidebarWidth` prop so the
        // inner content (flex children) can reflow responsively while dragging.
        // Use `box-border` so padding is included in the width calculation.
        <ScrollArea className='h-full relative overflow-hidden box-border select-none' style={{ width: `${sidebarWidth}px` }}>
            <div className='flex flex-col gap-1 p-4 pt-16 pr-4 md:pt-4'>
                {categories.map((category) => {
                    const isCategoryExpanded = expandedCategories.has(category.id);
                    return (
                        <div key={category.id} className='mb-2'>
                            <ContextMenu>
                                <ContextMenuTrigger>
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
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => handleClickNewFile(category.id)}>New file</ContextMenuItem>
                                    <ContextMenuItem
                                        onClick={() => {
                                            setNewSubCategoryOpen(true);
                                            setExpandedCategories(new Set(expandedCategories).add(`${category.id}`));
                                            inputRef.current?.focus();
                                            inputRef.current?.select();
                                        }}
                                    >
                                        New folder
                                    </ContextMenuItem>
                                    <ContextMenuItem variant='destructive' className='font-bold' onClick={() => handleClickDelete('category', category.id)}>
                                        Delete
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>

                            {isCategoryExpanded && (
                                <div className='ml-2 mt-1 flex flex-col gap-1'>
                                    {/* Render articles directly under category first */}
                                    {Array.isArray(category.articles) && category.articles.length > 0 && (
                                        <div className='flex flex-col gap-1'>
                                            {category.articles
                                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                .map((article) => (
                                                    <ContextMenu>
                                                        <ContextMenuTrigger>
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
                                                        </ContextMenuTrigger>
                                                        <ContextMenuContent>
                                                            <ContextMenuItem onClick={() => handleClickUpdate(article)}>Edit</ContextMenuItem>
                                                            <ContextMenuItem variant='destructive' className='font-bold' onClick={() => handleClickDelete('article', article.id)}>
                                                                Delete
                                                            </ContextMenuItem>
                                                        </ContextMenuContent>
                                                    </ContextMenu>
                                                ))}
                                        </div>
                                    )}

                                    {category.subCategories.map((sub) => {
                                        const subKey = `${category.id}-${sub.id}`;
                                        const isSubExpanded = expandedSubcategories.has(subKey);

                                        return (
                                            <div key={sub.id}>
                                                <ContextMenu>
                                                    <ContextMenuTrigger>
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
                                                    </ContextMenuTrigger>
                                                    <ContextMenuContent>
                                                        <ContextMenuItem onClick={() => handleClickNewFile(category.id, sub.id)}>New file</ContextMenuItem>
                                                        <ContextMenuItem variant='destructive' className='font-bold' onClick={() => handleClickDelete('sub-category', sub.id)}>
                                                            Delete
                                                        </ContextMenuItem>
                                                    </ContextMenuContent>
                                                </ContextMenu>

                                                {isSubExpanded && (
                                                    <div className='ml-4 mt-1 flex flex-col gap-1'>
                                                        {sub.articles
                                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                                            .map((article) => (
                                                                <ContextMenu>
                                                                    <ContextMenuTrigger>
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
                                                                    </ContextMenuTrigger>
                                                                    <ContextMenuContent>
                                                                        <ContextMenuItem onClick={() => handleClickUpdate(article)}>Edit</ContextMenuItem>
                                                                        <ContextMenuItem variant='destructive' className='font-bold' onClick={() => handleClickDelete('article', article.id)}>
                                                                            Delete
                                                                        </ContextMenuItem>
                                                                    </ContextMenuContent>
                                                                </ContextMenu>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {newSubCategoryOpen && (
                                        <div>
                                            <Input
                                                autoFocus
                                                value={categoryTitle}
                                                ref={inputRef}
                                                onChange={(e) => setCategoryTitle(e.target.value)}
                                                onBlur={() => {
                                                    setNewSubCategoryOpen(false);
                                                    setCategoryTitle('');
                                                }}
                                                onKeyDown={(e) => subCategoryKeyDown(e, category.id)}
                                                placeholder='New sub category title'
                                                className='w-full'
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {newCategoryOpen ? (
                    <div>
                        <Input
                            autoFocus
                            value={categoryTitle}
                            onChange={(e) => setCategoryTitle(e.target.value)}
                            onBlur={() => {
                                setNewCategoryOpen(false);
                                setCategoryTitle('');
                            }}
                            onKeyDown={categoryKeyDown}
                            placeholder='New category title'
                            className='w-full'
                        />
                    </div>
                ) : (
                    <Button
                        onClick={() => setNewCategoryOpen(true)}
                        variant={'ghost'}
                        className='w-full items-center justify-center gap-2 font-semibold min-w-0 px-3 text-left box-border overflow-hidden shrinkk'
                    >
                        <Plus className='w-4 h-4 ml-1' />
                    </Button>
                )}
            </div>
            {/* Resizer handle (click & drag to resize sidebar) */}
            <div className='absolute right-0 top-0 h-full w-2 -mr-1 cursor-col-resize z-40' onMouseDown={startDrag} aria-hidden />
        </ScrollArea>
    );
}
