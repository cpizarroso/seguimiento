import { useEffect, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface ToastProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    icon?: ReactNode;
    duration?: number;
    onClose: () => void;
}

const typeConfig: Record<NonNullable<ToastProps['type']>, { border: string; iconBg: string; iconColor: string; icon: IconName }> = {
    success: { border: 'border-l-excel-green', iconBg: 'bg-excel-green-light', iconColor: 'text-excel-green', icon: 'check' },
    error: { border: 'border-l-excel-red', iconBg: 'bg-[#fdecea] dark:bg-excel-red/10', iconColor: 'text-excel-red', icon: 'warning' },
    warning: { border: 'border-l-excel-gold', iconBg: 'bg-[#fff8d6] dark:bg-excel-gold/10', iconColor: 'text-[#8a6700] dark:text-excel-gold', icon: 'warning' },
    info: { border: 'border-l-excel-blue', iconBg: 'bg-[#e5f1fb] dark:bg-excel-blue/10', iconColor: 'text-excel-blue', icon: 'info' },
};

export function Toast({ type = 'info', title, description, icon, duration = 4000, onClose }: ToastProps) {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setLeaving(true);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = typeConfig[type];

    const handleClose = () => {
        setLeaving(true);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`fixed right-4 top-4 z-50 w-full max-w-sm transition-all duration-300 ease-in-out ${
                visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className={`rounded-md border border-excel-border border-l-4 bg-excel-surface p-3.5 shadow-xl dark:border-gray-700 dark:bg-gray-800 ${config.border}`}>
                <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded ${config.iconBg} ${config.iconColor}`}>
                        {icon ?? <Icon name={config.icon} size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-excel-text dark:text-gray-100">{title}</p>
                        {description && (
                            <p className="mt-0.5 text-xs text-excel-muted dark:text-gray-400">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 rounded p-1 text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                        aria-label="Cerrar notificación"
                    >
                        <Icon name="close" size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
