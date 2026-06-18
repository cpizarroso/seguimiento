import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    success: 'bg-patuju-green/10 dark:bg-patuju-green/20 text-patuju-green',
    warning: 'bg-patuju-yellow/10 dark:bg-patuju-yellow/20 text-patuju-yellow',
    danger: 'bg-patuju-red/10 dark:bg-patuju-red/20 text-patuju-red',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    primary: 'bg-patuju-green/10 dark:bg-patuju-green/20 text-patuju-green',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
