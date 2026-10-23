import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
    primary: 'border border-excel-green bg-excel-green text-white shadow-sm hover:bg-excel-green-dark hover:border-excel-green-dark',
    secondary: 'border border-excel-border-strong bg-excel-surface text-excel-text shadow-sm hover:bg-excel-surface-2 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700',
    danger: 'border border-excel-red bg-excel-red text-white shadow-sm hover:bg-[#a82317] hover:border-[#a82317]',
    ghost: 'border border-transparent bg-transparent text-excel-muted hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-300 dark:hover:bg-gray-800',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-8 gap-1.5 px-2.5 text-xs',
    md: 'h-9 gap-2 px-3.5 text-sm',
    lg: 'h-10 gap-2 px-4 text-sm',
};

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            className={`inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-excel-green/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-30" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3z" />
                </svg>
            )}
            {children}
        </button>
    );
}
