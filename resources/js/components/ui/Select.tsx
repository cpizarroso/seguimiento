import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-patuju-green">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white ${error ? 'border-patuju-red' : 'border-gray-300 dark:border-gray-600'} ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="text-xs text-patuju-red">{error}</p>}
        </div>
    );
}
