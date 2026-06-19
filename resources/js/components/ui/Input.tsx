import { type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    append?: string;
}

export function Input({ label, error, leftElement, rightElement, append, className = '', id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div>
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-patuju-green dark:text-patuju-green mb-1">
                    {label}
                </label>
            )}
            <div className={`relative ${append ? 'flex rounded-lg shadow-sm' : ''}`}>
                {leftElement && !append && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        {leftElement}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`block w-full border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white ${leftElement && !append ? 'pl-10' : ''} ${rightElement && !append ? 'pr-10' : ''} ${append ? 'rounded-l-lg' : 'rounded-lg'} ${error ? 'border-patuju-red' : 'border-gray-300 dark:border-gray-600'} ${className}`}
                    {...props}
                />
                {rightElement && !append && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rightElement}
                    </div>
                )}
                {append && (
                    <span className="inline-flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 dark:bg-gray-600 dark:border-gray-500 px-3 text-sm text-gray-500 dark:text-gray-300 whitespace-nowrap">
                        {append}
                    </span>
                )}
            </div>
            {error && <p className="text-xs text-patuju-red mt-1">{error}</p>}
        </div>
    );
}
