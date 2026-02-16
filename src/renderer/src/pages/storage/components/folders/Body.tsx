import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip';

export interface ArticleCardProps extends React.ComponentProps<'div'> {
    children: React.ReactNode;
    className?: string;
    hover?: string;
}

export default function Body({ hover, children, className, ...props }: ArticleCardProps) {
    return (
        <div {...props} className={className}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p>{children}</p>
                    </TooltipTrigger>
                    <TooltipContent className='px-2 py-0.5 bg-white' side='bottom'>
                        <p>{hover}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
