import React from 'react';

export interface ArticleCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Root({ children, className }: ArticleCardProps) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}