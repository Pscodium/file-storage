/* eslint-disable @typescript-eslint/no-explicit-any */
import { useArticle } from '@renderer/contexts/article';
import { Desktop } from './components/desktop';
import { FaBookOpen, FaPen, FaRegFolder } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { Article, ArticleGroup, Category, Subcategory } from './types/IArticle';
import { Button } from '@renderer/components/ui/button';
import { Menu, X } from 'lucide-react';
import { DocsHeader } from './components/docs/docs-header';
import { DocsSidebar } from './components/docs/docs-sidebar';
import { DocsContent } from './components/docs/docs-content';
import { apiService } from '@renderer/services/api';
import { useAuth } from '@renderer/contexts/auth';
import { IoSend } from 'react-icons/io5';
import DocsEditor from './components/docs/docs-editor';

export default function Articles(): JSX.Element {
    const { setIsOpen, isOpen, newSubSection, setNewSubSection, previewMode, setPreviewMode } = useArticle();
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(256);

    useEffect(() => {
        if (user) {
            getCategories();
        }
    }, [user]);

    // Apply dark theme only while this Articles component is mounted.
    useEffect(() => {
        document.documentElement.classList.add('dark');
        return () => {
            document.documentElement.classList.remove('dark');
        };
    }, []);

    async function getCategories() {
        try {
            setIsLoading(true);
            const data = await apiService.getCategories();

            // Mappers
            const normalizeArticle = (raw: any): Article => ({
                id: raw.id,
                title: raw.title,
                content: raw.content ?? '',
                files: raw.files ?? null,
                createdAt: raw.createdAt ?? raw.created_at,
                updatedAt: raw.updatedAt ?? raw.updated_at,
                UserId: raw.UserId ?? raw.userId ?? raw.user_id,
                order: raw.order,
            });

            const mapSub = (rawSub: any) => ({
                id: rawSub.id,
                title: rawSub.title,
                hex: rawSub.hex,
                articles: Array.isArray(rawSub.articles) ? rawSub.articles.map(normalizeArticle) : Array.isArray(rawSub.Articles) ? rawSub.Articles.map(normalizeArticle) : [],
            });

            // Detect Category[] shape (new API uses `subCategories` with capital C)
            if (Array.isArray(data) && data.length > 0 && ((data[0] as any).subCategories || (data[0] as any).subcategories)) {
                const cats = (data as any[]).map((rawCat) => {
                    const rawSubs = rawCat.subCategories ?? rawCat.subcategories ?? [];
                    const mappedSubs: Subcategory[] = rawSubs.map(mapSub);

                    // Note: keep top-level articles in `category.articles` and do not duplicate
                    // them inside subCategories to avoid rendering the same article twice.

                    return {
                        id: rawCat.id,
                        title: rawCat.title,
                        hex: rawCat.hex,
                        createdAt: rawCat.createdAt,
                        updatedAt: rawCat.updatedAt,
                        subCategories: mappedSubs,
                        articles: Array.isArray(rawCat.articles) ? rawCat.articles.map(normalizeArticle) : [],
                    } as Category;
                });

                setCategories(cats);
                const firstArticle = cats[0]?.subCategories?.[0]?.articles?.[0];
                if (firstArticle) setSelectedArticle(firstArticle);
            } else if (Array.isArray(data) && data.length > 0 && (data[0] as any).Articles) {
                // older ArticleGroup[] -> convert to Category[] with a single subcategory
                const groups = data as unknown as ArticleGroup[];
                const cats = groups.map((g) => ({
                    id: g.id,
                    title: g.title,
                    hex: (g as any).hex,
                    createdAt: g.createdAt,
                    updatedAt: g.updatedAt,
                    subCategories: [
                        {
                            id: `${g.id}-sub`,
                            title: g.title,
                            hex: (g as any).hex,
                            articles: (g.Articles || []).map(normalizeArticle),
                        },
                    ],
                    articles: (g.Articles || []).map(normalizeArticle),
                })) as Category[];

                setCategories(cats);
                const firstArticle = cats[0]?.subCategories?.[0]?.articles?.[0];
                if (firstArticle) setSelectedArticle(firstArticle);
            } else if (Array.isArray(data)) {
                // flat Article[] -> wrap into a single category/subcategory
                const flatRaw = data as any[];
                const flat = flatRaw.map(normalizeArticle);
                const cats: Category[] = [
                    {
                        id: 'cat-default',
                        title: 'Docs',
                        subCategories: [
                            {
                                id: 'sub-default',
                                title: 'General',
                                hex: '#000000',
                                articles: flat,
                            },
                        ],
                        articles: flat,
                    },
                ];
                setCategories(cats);
                const firstArticle = flat[0];
                if (firstArticle) setSelectedArticle(firstArticle);
            }
        } catch (err) {
            console.error(err);
            return undefined;
        } finally {
            setIsLoading(false);
        }
    }

    async function createArticle() {
        if (!newSubSection || !newSubSection.title || !newSubSection.message) return;

        if (newSubSection.edit) {
            try {
                const res = await apiService.updateArticle(selectedArticle?.id || '', newSubSection.title, newSubSection.message);
                console.log('Article updated successfully:', res);
                await getCategories();
                setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false, edit: false });
                setSelectedArticle(res);
                return;
            } catch (error) {
                console.error('Error updating article:', error);
                setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false, edit: false });
                setSelectedArticle(null);
                return;
            }
        }

        if (!newSubSection.categoryId) return;

        if (!newSubSection.subCategoryId) {
            try {
                const res = await apiService.createArticleOnCategory(newSubSection.categoryId, newSubSection.title, newSubSection.message);
                console.log('Article created successfully:', res);
                await getCategories();
                setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false });
                setSelectedArticle(res);
                return;
            } catch (error) {
                console.error('Error creating article:', error);
                setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false });
                setSelectedArticle(null);
                return;
            }
        }

        try {
            const res = await apiService.createArticleOnSubCategory(newSubSection.categoryId, newSubSection.subCategoryId, newSubSection.title, newSubSection.message);
            console.log('Article created successfully:', res);
            await getCategories();
            setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false });
            setSelectedArticle(res);
        } catch (error) {
            console.error('Error creating article:', error);
            setNewSubSection({ title: '', type: 'article', message: '', articleEditor: false });
            setSelectedArticle(null);
        }
    }

    async function deleteCallback(type: 'category' | 'article' | 'sub-category', id: string) {
        if (!id) return;

        try {
            if (type === 'category') {
                await apiService.deleteCategory(id);
            } else if (type === 'article') {
                await apiService.deleteArticle(id);
            } else if (type === 'sub-category') {
                await apiService.deleteSubCategory(id);
            }
            await getCategories();
        } catch (error) {
            console.error('Error deleting item:', error);
        } finally {
            setSelectedArticle(null);
        }
    }

    return (
        <div className='min-h-screen w-full items-center justify-center'>
            <div className='absolute w-full h-7 drag'>
                <Desktop.Root>
                    <Desktop.Window>
                        <div className='no-drag flex items-center gap-2 absolute h-5 top-2 z-999 pointer-events-auto ml-2 cursor-pointer'>
                            <div onClick={() => setIsOpen(!isOpen)} className='select-none cursor-pointer'>
                                <FaRegFolder size={13} className='hover:fill-gray-600 fill-black' />
                            </div>
                        </div>
                        <Desktop.WindowHeader>Articles</Desktop.WindowHeader>
                        <Desktop.WindowContent>
                            <div className='flex h-screen flex-col bg-background'>
                                <DocsHeader />

                                <div className='flex flex-1 overflow-hidden'>
                                    {/* Mobile sidebar toggle */}
                                    <Button variant='ghost' size='icon' className='fixed bottom-4 right-4 z-50 md:hidden' onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                        {isSidebarOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
                                    </Button>

                                    {/* Sidebar */}
                                    <aside
                                        className={`
                                        fixed inset-y-0 left-0 z-40 transform border-r border-sidebar-border bg-sidebar transition-transform duration-200 ease-in-out md:relative md:translate-x-0
                                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                                    `}
                                        style={{ width: sidebarWidth }}
                                    >
                                        <DocsSidebar
                                            categories={categories}
                                            selectedArticle={selectedArticle}
                                            onSelectArticle={(article) => {
                                                setSelectedArticle(article);
                                                setIsSidebarOpen(false);
                                                setNewSubSection({ title: '', type: 'article', articleEditor: false });
                                            }}
                                            isLoading={isLoading}
                                            sidebarWidth={sidebarWidth}
                                            setSidebarWidth={setSidebarWidth}
                                            getCategories={getCategories}
                                            deleteCallback={deleteCallback}
                                        />
                                    </aside>

                                    {/* Overlay for mobile */}
                                    {isSidebarOpen && <div className='fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden' onClick={() => setIsSidebarOpen(false)} />}

                                    {/* Main content */}
                                    <main className='flex-1 overflow-y-auto'>{newSubSection?.articleEditor ? <DocsEditor /> : <DocsContent article={selectedArticle} isLoading={isLoading} />}</main>
                                </div>
                            </div>
                            <>
                                {newSubSection?.articleEditor && (
                                    <>
                                        {previewMode ? (
                                            <Button className='absolute right-18 top-10 z-99 cursor-pointer bg-transparent hover:bg-secondary' onClick={() => setPreviewMode(false)}>
                                                <FaPen className='fill-foreground h-4 w-4' />
                                            </Button>
                                        ) : (
                                            <Button className='absolute right-18 top-10 z-99 cursor-pointer bg-transparent hover:bg-secondary' onClick={() => setPreviewMode(true)}>
                                                <FaBookOpen className='fill-foreground h-4 w-4' />
                                            </Button>
                                        )}
                                    </>
                                )}
                            </>
                            <>
                                {newSubSection?.articleEditor && (
                                    <>
                                        <Button
                                            disabled={(!newSubSection?.title && !newSubSection?.message) || newSubSection?.title === '' || newSubSection?.message === ''}
                                            className='absolute right-34 top-10 z-99 cursor-pointer bg-transparent hover:bg-secondary items-center'
                                            onClick={createArticle}
                                        >
                                            <IoSend className='fill-foreground h-4 w-4' />
                                        </Button>
                                    </>
                                )}
                            </>
                        </Desktop.WindowContent>
                    </Desktop.Window>
                </Desktop.Root>
            </div>
        </div>
    );
}
