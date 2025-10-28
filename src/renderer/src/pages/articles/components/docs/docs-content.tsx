import { Skeleton } from '@renderer/components/ui/skeleton';
import { Article } from '../../types/IArticle';
import { MarkdownRenderer } from './markdown-renderer';

interface DocsContentProps {
    article: Article | null;
    isLoading: boolean;
}

export function DocsContent({ article, isLoading }: DocsContentProps) {
    if (isLoading) {
        return (
            <div className='mx-auto max-w-4xl p-6 md:p-8'>
                <Skeleton className='mb-4 h-12 w-3/4' />
                <Skeleton className='mb-2 h-4 w-full' />
                <Skeleton className='mb-2 h-4 w-full' />
                <Skeleton className='mb-2 h-4 w-2/3' />
                <Skeleton className='mb-8 h-4 w-full' />
                <Skeleton className='mb-2 h-8 w-1/2' />
                <Skeleton className='mb-2 h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
            </div>
        );
    }

    if (!article) {
        return (
            <div className='flex h-full items-center justify-center p-8'>
                <div className='text-center'>
                    <h2 className='text-2xl font-semibold text-muted-foreground'>No article selected</h2>
                    <p className='mt-2 text-muted-foreground'>Select an article from the sidebar to view its content</p>
                </div>
            </div>
        );
    }

    return (
        <article className='mx-auto max-w-4xl p-6 md:p-8'>
            <h1 className='mb-6 text-4xl font-bold text-balance'>{article.title}</h1>
            <MarkdownRenderer content={article.content ?? article.body ?? ''} />
        </article>
    );
}
