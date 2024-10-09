/* eslint-disable no-unused-vars */
import React, { InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import { cn } from '@renderer/lib/utils';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    text: string | undefined;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    invalid?: boolean;
}

export default function FloatingLabelInput({ label, text, onChange, invalid, ...rest }: FloatingLabelInputProps) {
    const [focused, setFocused] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFocus = () => {
        setFocused(true);
        setTimeout(() => {
            setShowPlaceholder(true);
        }, 300);
    };

    const handleBlur = () => {
        if (text && text != '') {
            return;
        }
        setFocused(false);
        setShowPlaceholder(false);
    };

    const handleLabelClick = () => {
        if (inputRef.current && !focused) {
            inputRef.current.focus();
        }
    };

    useEffect(() => {
        if (text && text != '') {
            setFocused(true);
            setShowPlaceholder(false);
        }
    }, [text]);

    return (
        <div className='relative'>
            <input
                {...rest}
                className={cn(
                    `block w-full px-3 py-2 text-gray-800 placeholder-gray-300
                    border border-gray-300 rounded-md shadow-sm
                    ${invalid ? 'focus:outline-none focus:ring-red-500 focus:border-red-500 border-red-500' : 'focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'}`,
                    rest.className
                )}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={showPlaceholder ? rest.placeholder : ''}
                value={text}
                onChange={onChange}
                ref={inputRef}
            />
            <label
                onClick={handleLabelClick}
                className={cn(
                    `absolute cursor-text select-none left-3 transition-all duration-300 ${focused || rest.value ? '-top-2 text-xs text-gray-400 px-0.5' : 'top-2 text-base text-gray-500'}`,
                    rest.className
                )}
            >
                {label}
            </label>
        </div>
    );
}
