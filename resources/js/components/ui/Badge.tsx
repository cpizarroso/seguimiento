import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'secondary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'border-excel-border bg-excel-surface-2 text-excel-muted dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300',
    success: 'border-excel-green/25 bg-excel-green-light text-excel-green dark:border-excel-green/40 dark:bg-excel-green/15 dark:text-[#6fd394]',
    warning: 'border-excel-gold/40 bg-[#fff8d6] text-[#8a6700] dark:border-excel-gold/30 dark:bg-excel-gold/10 dark:text-excel-gold',
    danger: 'border-excel-red/25 bg-[#fdecea] text-excel-red dark:border-excel-red/30 dark:bg-excel-red/10 dark:text-[#f28b82]',
    info: 'border-excel-blue/25 bg-[#e5f1fb] text-[#005a9e] dark:border-excel-blue/30 dark:bg-excel-blue/10 dark:text-[#7cc0f5]',
    primary: 'border-excel-green/25 bg-excel-green-light text-excel-green dark:border-excel-green/40 dark:bg-excel-green/15 dark:text-[#6fd394]',
    secondary: 'border-excel-border bg-excel-surface-2 text-excel-muted dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold leading-5 ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
