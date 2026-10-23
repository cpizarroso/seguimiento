import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, required, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={selectId} className="block text-xs font-semibold text-excel-text dark:text-gray-200">
                    {label}
                    {required && <span className="ml-0.5 text-excel-red" aria-hidden="true">*</span>}
                </label>
            )}
            <select
                id={selectId}
                required={required}
                className={`block h-9 w-full rounded-md border bg-excel-surface px-3 text-sm text-excel-text shadow-sm transition-colors focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:bg-gray-800 dark:text-gray-100 ${error ? 'border-excel-red' : 'border-excel-border-strong dark:border-gray-600'} ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-excel-red">{error}</p>}
        </div>
    );
}
