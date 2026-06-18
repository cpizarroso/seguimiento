import { useEffect, useState } from 'react';

interface ToastProps {
    type?: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    icon?: string;
    duration?: number;
    onClose: () => void;
}

const typeConfig = {
    success: { bg: 'bg-white dark:bg-gray-800', border: 'border-green-400', icon: '✓' },
    error: { bg: 'bg-white dark:bg-gray-800', border: 'border-red-400', icon: '✕' },
    warning: { bg: 'bg-white dark:bg-gray-800', border: 'border-yellow-400', icon: '⚠' },
    info: { bg: 'bg-white dark:bg-gray-800', border: 'border-blue-400', icon: 'ℹ' },
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
            className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-in-out ${
                visible && !leaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}
        >
            <div className={`rounded-lg border-2 border-l-4 ${config.border} ${config.bg} shadow-xl p-4`}>
                <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                        {icon ?? config.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                        {description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
