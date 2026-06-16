interface PaginationProps {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
    if (lastPage <= 1) return null;

    const pages: number[] = [];
    for (let i = 1; i <= lastPage; i++) {
        pages.push(i);
    }

    return (
        <nav className="flex items-center justify-center gap-1 mt-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300"
            >
                Anterior
            </button>
            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-sm rounded border ${page === currentPage ? 'bg-patuju-green text-white border-patuju-green' : 'border-gray-300 dark:border-gray-600 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300'}`}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300"
            >
                Siguiente
            </button>
        </nav>
    );
}
