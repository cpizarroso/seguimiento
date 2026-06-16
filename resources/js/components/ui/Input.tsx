import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    rightElement?: ReactNode;
}

export function Input({ label, error, rightElement, className = '', id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-patuju-green">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white ${rightElement ? 'pr-10' : ''} ${error ? 'border-patuju-red' : 'border-gray-300 dark:border-gray-600'} ${className}`}
                    {...props}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-patuju-red">{error}</p>}
        </div>
    );
}
