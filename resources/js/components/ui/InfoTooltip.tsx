import { useId, useState } from 'react';
import { Icon } from './Icon';

interface InfoTooltipProps {
    text: string;
    label?: string;
}

export function InfoTooltip({ text, label = 'Más información' }: InfoTooltipProps) {
    const id = useId();
    const [open, setOpen] = useState(false);

    return (
        <span className="relative inline-flex align-middle">
            <button
                type="button"
                aria-label={label}
                aria-describedby={open ? id : undefined}
                onClick={() => setOpen(true)}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }}
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-excel-muted transition-colors hover:text-patuju-green focus:outline-none focus:ring-2 focus:ring-patuju-green/40 dark:text-gray-400"
            >
                <Icon name="info" size={14} />
            </button>

            {open && (
                <span
                    id={id}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-50 mb-2 w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 whitespace-pre-line rounded-lg border border-gray-200 bg-white p-3 text-left text-[11px] font-normal leading-snug text-gray-700 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                    {text}
                </span>
            )}
        </span>
    );
}
