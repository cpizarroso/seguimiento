import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
    return (
        <div
            className={`w-full rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-patuju-green/20 dark:border-gray-700 ${paddingClasses[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
