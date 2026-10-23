import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface FilterChipProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    title?: string;
    icon?: IconName;
    children?: ReactNode;
}

export function FilterChip({
    label,
    checked,
    onChange,
    disabled = false,
    title,
    icon,
    children,
}: FilterChipProps) {
    return (
        <label
            title={title}
            className={`inline-flex select-none items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-within:ring-2 focus-within:ring-excel-green/30 ${
                disabled
                    ? 'cursor-not-allowed border-excel-border bg-excel-surface-2 text-excel-muted opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                    : checked
                        ? 'cursor-pointer border-excel-green/40 bg-excel-green-light text-excel-green dark:border-excel-green/50 dark:bg-excel-green/15 dark:text-[#6fd394]'
                        : 'cursor-pointer border-excel-border-strong bg-excel-surface text-excel-muted hover:border-excel-green/40 hover:bg-excel-green-light/60 hover:text-excel-text dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                disabled={disabled}
                className="sr-only"
            />
            <span
                className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    checked
                        ? 'border-excel-green bg-excel-green text-white'
                        : 'border-excel-border-strong bg-excel-surface dark:border-gray-500 dark:bg-gray-900'
                }`}
                aria-hidden="true"
            >
                {checked && <Icon name="check" size={10} strokeWidth={2.5} />}
            </span>
            {icon && <Icon name={icon} size={14} className="flex-shrink-0" />}
            <span>{label}</span>
            {children}
        </label>
    );
}
