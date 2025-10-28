import { cn } from '@renderer/lib/utils';
import React from 'react';

export interface ArticleCardProps extends React.ComponentProps<'div'> {
    children: React.ReactNode;
}

export default function Window({ children, ...props }: ArticleCardProps) {
    return <div className={cn('w-full h-full rounded-md overflow-hidden', props.className)}>{children}</div>;
}
