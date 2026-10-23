import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

export type SortDirection = 'asc' | 'desc';
export type TableKey = string | number;

export interface Column<T> {
    key: string;
    header: string;
    headClassName?: string;
    cellClassName?: string;
    sortable?: boolean;
    render?: (item: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    emptyMessage?: string;
    sortBy?: string | null;
    sortDirection?: SortDirection;
    onSort?: (key: string) => void;
    selectable?: boolean;
    selectedKeys?: TableKey[];
    onSelectionChange?: (keys: TableKey[]) => void;
    isRowSelectable?: (item: T) => boolean;
    getRowLabel?: (item: T) => string;
}

export function Table<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = 'No hay datos disponibles.',
    sortBy = null,
    sortDirection = 'asc',
    onSort,
    selectable = false,
    selectedKeys = [],
    onSelectionChange,
    isRowSelectable = () => true,
    getRowLabel = () => 'Seleccionar fila',
}: TableProps<T>) {
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    const seleccionActiva = selectable && typeof onSelectionChange === 'function';
    const keysSeleccionables = seleccionActiva
        ? data.filter((item) => isRowSelectable(item)).map((item) => keyExtractor(item))
        : [];
    const keysSeleccionadas = keysSeleccionables.filter((key) => selectedKeys.includes(key));
    const todosSeleccionados = keysSeleccionables.length > 0 && keysSeleccionadas.length === keysSeleccionables.length;
    const algunosSeleccionados = keysSeleccionadas.length > 0 && !todosSeleccionados;

    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = algunosSeleccionados;
        }
    }, [algunosSeleccionados]);

    const alternarTodos = () => {
        if (!onSelectionChange) return;

        if (todosSeleccionados) {
            onSelectionChange(selectedKeys.filter((key) => !keysSeleccionables.includes(key)));

            return;
        }

        const siguiente = new Set(selectedKeys);
        keysSeleccionables.forEach((key) => siguiente.add(key));
        onSelectionChange([...siguiente]);
    };

    const alternarFila = (key: TableKey) => {
        if (!onSelectionChange) return;

        onSelectionChange(
            selectedKeys.includes(key)
                ? selectedKeys.filter((seleccionada) => seleccionada !== key)
                : [...selectedKeys, key],
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-excel-surface-2 text-excel-muted dark:bg-gray-700">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
                    </svg>
                </div>
                <p className="text-sm text-excel-muted dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-md border border-excel-border dark:border-gray-700">
            <table className="min-w-full border-collapse text-[13px]">
                <thead className="sticky top-0 z-10 bg-excel-surface-2 dark:bg-gray-800">
                    <tr>
                        {seleccionActiva && (
                            <th scope="col" className="w-10 border-b border-excel-border px-3 py-2.5 text-center dark:border-gray-700">
                                <input
                                    ref={headerCheckboxRef}
                                    type="checkbox"
                                    aria-label="Seleccionar todos"
                                    checked={todosSeleccionados}
                                    onChange={alternarTodos}
                                    disabled={keysSeleccionables.length === 0}
                                    className="h-4 w-4 cursor-pointer rounded accent-excel-green disabled:cursor-not-allowed"
                                />
                            </th>
                        )}
                        {columns.map((col) => {
                            const active = sortBy === col.key;
                            const sortable = col.sortable === true && typeof onSort === 'function';

                            return (
                                <th
                                    key={col.key}
                                    scope="col"
                                    aria-sort={sortable && active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                                    className={`border-b border-excel-border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-excel-muted dark:border-gray-700 dark:text-gray-400 ${col.headClassName ?? ''}`}
                                >
                                    {sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => onSort(col.key)}
                                            className="group inline-flex items-center gap-1 rounded-sm text-left transition-colors hover:text-excel-text focus:outline-none focus-visible:ring-2 focus-visible:ring-excel-green/40 dark:hover:text-gray-100"
                                            title={`Ordenar por ${col.header}`}
                                        >
                                            <span>{col.header}</span>
                                            <Icon
                                                name={active ? (sortDirection === 'asc' ? 'arrow-up' : 'arrow-down') : 'sort'}
                                                size={12}
                                                className={active ? 'text-excel-green' : 'text-excel-muted/30 transition-colors group-hover:text-excel-muted group-focus-visible:text-excel-muted'}
                                            />
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-excel-border bg-excel-surface dark:divide-gray-700 dark:bg-gray-800">
                    {data.map((item) => {
                        const key = keyExtractor(item);
                        const seleccionable = isRowSelectable(item);

                        return (
                            <tr
                                key={key}
                                className="group transition-colors hover:bg-excel-green-light/60 dark:hover:bg-gray-700/60"
                            >
                                {seleccionActiva && (
                                    <td className="border-r border-excel-border/60 px-3 py-2.5 text-center align-middle dark:border-gray-700/60">
                                        <input
                                            type="checkbox"
                                            aria-label={getRowLabel(item)}
                                            checked={selectedKeys.includes(key)}
                                            onChange={() => alternarFila(key)}
                                            disabled={!seleccionable}
                                            className="h-4 w-4 cursor-pointer rounded accent-excel-green disabled:cursor-not-allowed"
                                        />
                                    </td>
                                )}
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`border-r border-excel-border/60 px-3 py-2.5 align-middle text-excel-text last:border-r-0 dark:border-gray-700/60 dark:text-gray-200 ${col.cellClassName ?? ''}`}
                                    >
                                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
