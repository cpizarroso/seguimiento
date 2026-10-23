import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
    return (
        <div
            className={`w-full rounded-lg border border-excel-border bg-excel-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-gray-700 dark:bg-gray-800 ${paddingClasses[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
