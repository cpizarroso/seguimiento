import type { ReactNode } from 'react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    emptyMessage?: string;
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No hay datos disponibles.' }: TableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-patuju-green text-white">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 text-left font-medium">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {data.map((item) => (
                        <tr key={keyExtractor(item)} className="hover:bg-patuju-cream/50 dark:hover:bg-gray-700 transition-colors">
                            {columns.map((col) => (
                                <td key={col.key} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                    {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
