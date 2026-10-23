import { type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    append?: string;
    labelAdornment?: ReactNode;
}

export function Input({ label, error, leftElement, rightElement, append, labelAdornment, className = '', id, required, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div>
            {label && (
                <div className="mb-1.5 flex items-center gap-1">
                    <label htmlFor={inputId} className="block text-xs font-semibold text-excel-text dark:text-gray-200">
                        {label}
                        {required && <span className="ml-0.5 text-excel-red" aria-hidden="true">*</span>}
                    </label>
                    {labelAdornment && <span className="inline-flex align-middle">{labelAdornment}</span>}
                </div>
            )}
            <div className={`relative ${append ? 'flex rounded-md shadow-sm' : ''}`}>
                {leftElement && !append && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-excel-muted">
                        {leftElement}
                    </div>
                )}
                <input
                    id={inputId}
                    required={required}
                    className={`block h-9 w-full rounded-md border bg-excel-surface px-3 text-sm text-excel-text shadow-sm transition-colors placeholder:text-excel-muted/70 focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 disabled:bg-excel-surface-2 disabled:text-excel-muted dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ${leftElement && !append ? 'pl-9' : ''} ${rightElement && !append ? 'pr-9' : ''} ${append ? 'rounded-r-none' : ''} ${error ? 'border-excel-red' : 'border-excel-border-strong dark:border-gray-600'} ${className}`}
                    {...props}
                />
                {rightElement && !append && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
                        {rightElement}
                    </div>
                )}
                {append && (
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-excel-border-strong bg-excel-surface-2 px-3 text-xs font-medium text-excel-muted dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {append}
                    </span>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-excel-red">{error}</p>}
        </div>
    );
}
