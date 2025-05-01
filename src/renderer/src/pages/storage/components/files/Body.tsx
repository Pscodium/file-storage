import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip';
import { FaCheckCircle } from 'react-icons/fa';

export interface ArticleCardProps extends React.ComponentProps<'div'> {
    children: React.ReactNode;
    className?: string;
    hover?: string;
    selectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Body({ hover, children, className, selectionMode = false, isSelected = false, onSelect, ...props }: ArticleCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        if (selectionMode && onSelect) {
            e.stopPropagation();
            onSelect(e as React.MouseEvent<HTMLDivElement>);
        }

        if (!selectionMode && props.onClick) {
            props.onClick(e as React.MouseEvent<HTMLDivElement>);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        {...props}
                        onClick={handleClick}
                        className={`${className} ${selectionMode ? 'cursor-pointer' : ''} 
                        ${isSelected ? 'bg-blue-100 border-2 border-blue-500' : ''}`}
                    >
                        {selectionMode && (
                            <div className='absolute top-1 right-1 z-10'>
                                <div className={`h-5 w-5 rounded-full border ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-400'} flex items-center justify-center`}>
                                    {isSelected && <FaCheckCircle size={14} className='text-white' />}
                                </div>
                            </div>
                        )}
                        {children}
                    </div>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                    <p>{hover}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
