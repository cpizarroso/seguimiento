import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const widths: Record<NonNullable<ModalProps['maxWidth']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-3xl',
};

export function Modal({ open, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
            <div className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-lg border border-excel-border bg-excel-surface p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-800 ${widths[maxWidth]}`}>
                {title && (
                    <div className="mb-4 flex items-center justify-between gap-4 border-b border-excel-border pb-3 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-excel-text dark:text-gray-100">{title}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-7 w-7 items-center justify-center rounded text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            aria-label="Cerrar"
                        >
                            <Icon name="close" size={16} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}
