import { Icon } from './Icon';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    perPage?: number;
    label?: string;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

function getPageRange(current: number, last: number, siblings: number = 1): (number | 'ellipsis')[] {
    const total = last;
    const left = Math.max(2, current - siblings);
    const right = Math.min(total - 1, current + siblings);

    const range: (number | 'ellipsis')[] = [1];

    if (left > 2) range.push('ellipsis');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < total - 1) range.push('ellipsis');

    if (total > 1) range.push(total);

    return range;
}

const PER_PAGE_OPTIONS = [5, 10, 15, 20];

export function Pagination({ currentPage, lastPage, from, to, total = 0, perPage, label = 'registros', onPageChange, onPerPageChange }: PaginationProps) {
    if (lastPage <= 1 && !onPerPageChange) return null;

    const pages = getPageRange(currentPage, lastPage);
    const perPageOptions = perPage && !PER_PAGE_OPTIONS.includes(perPage)
        ? [...PER_PAGE_OPTIONS, perPage].sort((a, b) => a - b)
        : PER_PAGE_OPTIONS;

    return (
        <div className="mt-3 flex flex-col items-center justify-between gap-3 border-t border-excel-border px-2 pt-3 text-xs text-excel-muted dark:border-gray-700 dark:text-gray-400 sm:flex-row">
            <div className="flex items-center gap-4">
                {from != null && to != null ? (
                    <span>
                        Mostrando <strong className="font-semibold text-excel-text dark:text-gray-200">{from}–{to}</strong> de {total} {label}
                    </span>
                ) : (
                    <span>{total} {label}</span>
                )}
                {onPerPageChange && (
                    <label className="flex items-center gap-1.5">
                        <select
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="h-7 rounded border border-excel-border-strong bg-excel-surface px-2 text-xs text-excel-text focus:border-excel-green focus:outline-none focus:ring-1 focus:ring-excel-green/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        >
                            {perPageOptions.map((n) => (
                                <option key={n} value={n}>{n} por página</option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {lastPage > 1 && (
                <nav className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-excel-border-strong bg-excel-surface text-excel-muted transition-colors hover:bg-excel-surface-2 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Página anterior"
                    >
                        <Icon name="chevron-left" size={14} />
                    </button>
                    {pages.map((page, i) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${i}`} className="select-none px-1.5 text-gray-400">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`inline-flex h-7 min-w-7 items-center justify-center rounded border px-1.5 text-xs font-medium transition-colors ${
                                    page === currentPage
                                        ? 'border-excel-green bg-excel-green text-white'
                                        : 'border-excel-border-strong bg-excel-surface text-excel-muted hover:bg-excel-surface-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === lastPage}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-excel-border-strong bg-excel-surface text-excel-muted transition-colors hover:bg-excel-surface-2 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        aria-label="Página siguiente"
                    >
                        <Icon name="chevron-right" size={14} />
                    </button>
                </nav>
            )}
        </div>
    );
}
