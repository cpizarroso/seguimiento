import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-patuju-green">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white ${error ? 'border-patuju-red' : 'border-gray-300 dark:border-gray-600'} ${className}`}
                {...props}
            />
            {error && <p className="text-xs text-patuju-red">{error}</p>}
        </div>
    );
}
