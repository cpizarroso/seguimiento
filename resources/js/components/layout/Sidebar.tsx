import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '@/hooks/useTheme';

const menuItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊' },
    { label: 'Trámites', href: '/tramites', icon: '📋' },
    { label: 'Funcionarios', href: '/funcionarios', icon: '👥' },
    { label: 'Puestos', href: '/puestos', icon: '🏢' },
    { label: 'Contador', href: '/contador', icon: '🔢' },
    { label: 'Reporte', href: '/reporte', icon: '📈' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const { url } = usePage();
    const { theme, toggle } = useTheme();

    const isActive = (href: string) => {
        if (href === '/dashboard') return url === '/dashboard';
        return url.startsWith(href);
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${
                open ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
            <div className="flex h-16 items-center justify-between gap-2 px-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">📌</span>
                    <h1 className="text-lg font-bold text-patuju-green dark:text-patuju-green">Seguimiento</h1>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 md:hidden"
                >
                    ✕
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                            isActive(item.href)
                                ? 'bg-patuju-green text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-patuju-green/10 dark:hover:bg-patuju-green/20 hover:text-patuju-green dark:hover:text-patuju-green'
                        }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2">
                <button
                    onClick={toggle}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-patuju-green/10 dark:hover:bg-patuju-green/20 hover:text-patuju-green transition-colors"
                >
                    <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>

                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-patuju-red/10 hover:text-patuju-red transition-colors"
                >
                    <span>🚪</span>
                    <span>Cerrar sesión</span>
                </Link>
            </div>
        </aside>
    );
}
