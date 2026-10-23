import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

export interface SearchableSelectOption {
    value: string;
    label: string;
    path?: string;
    depth?: number;
    activo?: boolean;
    disabled?: boolean;
    description?: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    error?: string;
    clearable?: boolean;
    clearLabel?: string;
    showPath?: boolean;
    className?: string;
    required?: boolean;
    id?: string;
    ariaLabel?: string;
}

const ACENTOS: Record<string, string> = {
    a: 'aáàäâã', e: 'eéèëê', i: 'iíìïî',
    o: 'oóòöôõ', u: 'uúùüû', n: 'nñ', c: 'cç',
};

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .split('')
        .map((c) => {
            const encontrado = Object.entries(ACENTOS).find(([, variantes]) => variantes.includes(c));
            return encontrado ? encontrado[0] : c;
        })
        .join('');
}

export function SearchableSelect({
    options,
    value,
    onChange,
    label,
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    emptyMessage = 'No se encontraron resultados.',
    disabled = false,
    error,
    clearable = false,
    clearLabel = 'Sin selección',
    showPath = true,
    className = '',
    required = false,
    id,
    ariaLabel,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const seleccionada = options.find((opcion) => opcion.value === value);

    const filtradas = useMemo(() => {
        const termino = normalizar(query.trim());
        if (!termino) return options;

        return options.filter((opcion) => {
            const texto = normalizar([opcion.label, opcion.path, opcion.description].filter(Boolean).join(' '));
            return texto.includes(termino);
        });
    }, [options, query]);

    useEffect(() => {
        if (!open) return;

        const handleClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
            const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
            return () => window.clearTimeout(timer);
        }
    }, [open]);

    const seleccionar = (opcion: SearchableSelectOption) => {
        if (opcion.disabled) return;
        onChange(opcion.value);
        setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((indice) => Math.min(indice + 1, filtradas.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((indice) => Math.max(indice - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const opcion = filtradas[activeIndex];
            if (opcion) seleccionar(opcion);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    };

    return (
        <div className={`space-y-1 ${className}`} ref={containerRef}>
            {label && (
                <label htmlFor={selectId} className="block text-xs font-semibold text-excel-text dark:text-gray-200">
                    {label}
                    {required && <span className="text-patuju-red ml-0.5" aria-hidden="true">*</span>}
                </label>
            )}

            <div className="relative">
                <button
                    id={selectId}
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((estado) => !estado)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-label={ariaLabel}
                    className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-excel-surface px-3 text-left text-sm shadow-sm transition-colors focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 disabled:cursor-not-allowed disabled:bg-excel-surface-2 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900 ${error ? 'border-excel-red' : 'border-excel-border-strong dark:border-gray-600'}`}
                >
                    <span className={seleccionada ? 'truncate text-gray-900 dark:text-white' : 'truncate text-gray-400'}>
                        {seleccionada
                            ? showPath && seleccionada.path
                                ? seleccionada.path
                                : seleccionada.label
                            : placeholder}
                    </span>
                    <Icon name="chevron-down" size={14} className="flex-shrink-0 text-excel-muted" />
                </button>

                {open && (
                    <div className="absolute z-30 mt-1 w-full rounded-md border border-excel-border bg-excel-surface shadow-xl dark:border-gray-600 dark:bg-gray-800">
                        <div className="border-b border-excel-border p-2 dark:border-gray-700">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={searchPlaceholder}
                                className="h-8 w-full rounded border border-excel-border-strong bg-excel-surface px-2.5 text-sm text-excel-text focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
                            {clearable && (
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(null);
                                            setOpen(false);
                                        }}
                                        className="block w-full px-3 py-2 text-left text-sm text-excel-muted hover:bg-excel-green-light dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        {clearLabel}
                                    </button>
                                </li>
                            )}

                            {filtradas.length === 0 && (
                                <li className="px-3 py-2 text-sm text-gray-400">{emptyMessage}</li>
                            )}

                            {filtradas.map((opcion, indice) => (
                                <li key={opcion.value} role="option" aria-selected={opcion.value === value}>
                                    <button
                                        type="button"
                                        disabled={opcion.disabled}
                                        onClick={() => seleccionar(opcion)}
                                        onMouseEnter={() => setActiveIndex(indice)}
                                        className={`block w-full px-3 py-2 text-left text-sm transition-colors ${opcion.disabled ? 'cursor-not-allowed text-gray-300 dark:text-gray-600' : 'hover:bg-excel-green-light dark:hover:bg-gray-700'} ${indice === activeIndex && !opcion.disabled ? 'bg-excel-green-light dark:bg-gray-700' : ''} ${opcion.value === value ? 'font-semibold text-excel-green' : 'text-excel-text dark:text-gray-200'}`}
                                    >
                                        <span style={{ paddingLeft: `${(opcion.depth ?? 0) * 12}px` }}>
                                            {opcion.label}
                                        </span>
                                        {showPath && opcion.path && opcion.path !== opcion.label && (
                                            <span className="ml-2 block text-xs text-gray-400">{opcion.path}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-patuju-red">{error}</p>}
        </div>
    );
}
