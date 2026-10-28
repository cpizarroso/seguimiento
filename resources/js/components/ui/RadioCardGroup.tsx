import type { ReactNode } from 'react';

export interface RadioCardOption {
    value: string;
    label: string;
    description?: string;
    preview?: string;
    disabled?: boolean;
    disabledReason?: string;
}

interface RadioCardGroupProps {
    name: string;
    options: RadioCardOption[];
    value: string | null;
    onChange: (value: string) => void;
    label?: string;
    labelRight?: ReactNode;
    error?: string;
}

export function RadioCardGroup({
    name,
    options,
    value,
    onChange,
    label,
    labelRight,
    error,
}: RadioCardGroupProps) {
    return (
        <div className="space-y-2">
            {(label || labelRight) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {label && <span className="text-xs font-semibold text-excel-text dark:text-gray-200">{label}</span>}
                    {labelRight}
                </div>
            )}

            <div role="radiogroup" aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map((option) => {
                    const checked = value === option.value;

                    return (
                        <label
                            key={option.value}
                            title={option.disabled ? option.disabledReason : undefined}
                            className={`flex items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                                option.disabled
                                    ? 'cursor-not-allowed border-excel-border opacity-50 dark:border-gray-700'
                                    : checked
                                        ? 'cursor-pointer border-excel-green bg-excel-green-light/60 dark:border-excel-green/50 dark:bg-excel-green/10'
                                        : 'cursor-pointer border-excel-border-strong hover:border-excel-green/60 dark:border-gray-600'
                            }`}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={option.value}
                                checked={checked}
                                disabled={option.disabled}
                                onChange={() => onChange(option.value)}
                                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-excel-green"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-excel-text dark:text-gray-100">
                                    {option.label}
                                </span>
                                {option.description && (
                                    <span className="block text-xs text-excel-muted dark:text-gray-400">
                                        {option.description}
                                    </span>
                                )}
                            </span>
                            {option.preview && (
                                <code className="flex-shrink-0 rounded bg-excel-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-excel-text dark:bg-gray-700 dark:text-gray-200">
                                    {option.preview}
                                </code>
                            )}
                        </label>
                    );
                })}
            </div>

            {error && <p className="text-xs text-excel-red">{error}</p>}
        </div>
    );
}
