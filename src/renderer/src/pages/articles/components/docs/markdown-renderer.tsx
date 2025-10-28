/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            (marked as any).setOptions({
                gfm: true,
                breaks: true,
            });

            const html = marked.parse(content) as string;

            const processedHtml = html.replace(/\[ \]/g, '<input type="checkbox" disabled />').replace(/\[x\]/gi, '<input type="checkbox" checked disabled />');

            contentRef.current.innerHTML = processedHtml;

            try {
                if (typeof (hljs as any).highlightAll === 'function') {
                    (hljs as any).highlightAll();
                }
            } catch (e) {
                console.error('Error applying syntax highlighting:', e);
            }
        }
    }, [content]);

    return <div ref={contentRef} className='markdown-content' />;
}
