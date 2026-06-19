interface PaginationProps {
    currentPage: number;
    lastPage: number;
    from: number | null;
    to: number | null;
    total: number;
    perPage: number;
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

const PER_PAGE_OPTIONS = [5, 10];

export function Pagination({ currentPage, lastPage, from, to, total, perPage, onPageChange, onPerPageChange }: PaginationProps) {
    if (lastPage <= 1 && !onPerPageChange) return null;

    const pages = getPageRange(currentPage, lastPage);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>
                    Mostrando {from ?? '—'}-{to ?? '—'} de {total} trámites
                </span>
                {onPerPageChange && (
                    <label className="flex items-center gap-1.5">
                        <select
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-patuju-green"
                        >
                            {PER_PAGE_OPTIONS.map((n) => (
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
                        className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                    >
                        Anterior
                    </button>
                    {pages.map((page, i) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-gray-500 select-none">...</span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`min-w-[2rem] px-2 py-1 text-sm rounded border transition-colors ${
                                    page === currentPage
                                        ? 'bg-patuju-green text-white border-patuju-green font-medium'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    )}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === lastPage}
                        className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                    >
                        Siguiente
                    </button>
                </nav>
            )}
        </div>
    );
}
