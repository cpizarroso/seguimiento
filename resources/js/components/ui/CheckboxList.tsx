import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

export interface CheckboxListItem {
    value: string;
    label: string;
    description?: string;
}

interface CheckboxListProps {
    items: CheckboxListItem[];
    selected: string[];
    onChange: (selected: string[]) => void;
    label?: string;
    labelRight?: ReactNode;
    searchPlaceholder?: string;
    emptyMessage?: string;
    error?: string;
    disabled?: boolean;
    maxHeightClassName?: string;
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

export function CheckboxList({
    items,
    selected,
    onChange,
    label,
    labelRight,
    searchPlaceholder = 'Filtrar opciones...',
    emptyMessage = 'No se encontraron opciones.',
    error,
    disabled = false,
    maxHeightClassName = 'max-h-56',
}: CheckboxListProps) {
    const [query, setQuery] = useState('');

    const visibles = useMemo(() => {
        const q = normalizar(query.trim());

        if (!q) return items;

        return items.filter((item) => normalizar(`${item.label} ${item.description ?? ''}`).includes(q));
    }, [items, query]);

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter((item) => item !== value)
                : [...selected, value],
        );
    };

    const seleccionarVisibles = () => {
        const siguiente = new Set(selected);
        visibles.forEach((item) => siguiente.add(item.value));
        onChange([...siguiente]);
    };

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-excel-text dark:text-gray-200">{label}</span>
                    <div className="flex items-center gap-2">
                        {labelRight}
                        <span
                            className="inline-flex items-center gap-1 rounded-full border border-excel-green/30 bg-excel-green-light px-2 py-0.5 text-[11px] font-semibold text-excel-green dark:border-excel-green/40 dark:bg-excel-green/15 dark:text-[#6fd394]"
                            aria-live="polite"
                        >
                            {selected.length} seleccionada{selected.length === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>
            )}

            <div
                className={`overflow-hidden rounded-md border bg-excel-surface dark:bg-gray-800 ${
                    error ? 'border-excel-red' : 'border-excel-border-strong dark:border-gray-600'
                }`}
            >
                <div className="flex items-center gap-2 border-b border-excel-border px-2.5 dark:border-gray-700">
                    <Icon name="search" size={15} className="flex-shrink-0 text-excel-muted dark:text-gray-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={searchPlaceholder}
                        aria-label={searchPlaceholder}
                        disabled={disabled}
                        className="h-8 w-full bg-transparent text-sm text-excel-text outline-none placeholder:text-excel-muted/70 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="flex-shrink-0 text-excel-muted transition-colors hover:text-excel-text dark:text-gray-500 dark:hover:text-gray-200"
                            aria-label="Limpiar filtro"
                        >
                            <Icon name="close" size={13} />
                        </button>
                    )}
                </div>

                <div className={`divide-y divide-excel-border/60 overflow-y-auto dark:divide-gray-700/60 ${maxHeightClassName}`}>
                    {visibles.length === 0 && (
                        <p className="px-3 py-4 text-center text-xs text-excel-muted dark:text-gray-500">{emptyMessage}</p>
                    )}

                    {visibles.map((item) => {
                        const checked = selected.includes(item.value);

                        return (
                            <label
                                key={item.value}
                                className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    checked
                                        ? 'bg-excel-green-light/60 dark:bg-excel-green/10'
                                        : 'hover:bg-excel-surface-2 dark:hover:bg-gray-700/50'
                                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(item.value)}
                                    disabled={disabled}
                                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-excel-green"
                                />
                                <span className="min-w-0">
                                    <span className="block font-medium text-excel-text dark:text-gray-100">{item.label}</span>
                                    {item.description && (
                                        <span className="block text-xs text-excel-muted dark:text-gray-400">{item.description}</span>
                                    )}
                                </span>
                            </label>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-excel-border px-2.5 py-1.5 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={seleccionarVisibles}
                        disabled={disabled || visibles.length === 0}
                        className="text-[11px] font-semibold text-excel-green hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Seleccionar visibles
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange([])}
                        disabled={disabled || selected.length === 0}
                        className="text-[11px] font-semibold text-excel-muted hover:text-excel-text hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {error && <p className="text-xs text-excel-red">{error}</p>}
        </div>
    );
}
