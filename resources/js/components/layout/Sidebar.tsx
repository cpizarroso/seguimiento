import { Link, usePage } from '@inertiajs/react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
    label: string;
    href: string;
    icon: IconName;
    permission?: string;
}

const allMenuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', permission: 'dashboard' },
    { label: 'Trámites', href: '/tramites', icon: 'document', permission: 'tramites' },
    { label: 'Personas', href: '/personas', icon: 'people', permission: 'personas' },
    { label: 'Áreas y Puestos', href: '/areas', icon: 'building', permission: 'areas_puestos' },
    { label: 'Reporte', href: '/reporte', icon: 'chart', permission: 'reporte' },
    { label: 'Configuración', href: '/configuracion', icon: 'settings', permission: 'configuracion' },
    { label: 'Usuarios', href: '/users', icon: 'key', permission: 'usuarios' },
    { label: 'Roles', href: '/roles', icon: 'shield', permission: 'roles' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
    const { url, props } = usePage();
    const { theme, toggle } = useTheme();
    const authUser = props.auth?.user as { role?: string; permisos?: string[] } | null;
    const permisos = authUser?.permisos ?? [];

    const menuItems = allMenuItems.filter((item) => {
        if (item.permission) return permisos.includes(`${item.permission}.consulta`);
        return true;
    });

    const isActive = (href: string) => {
        if (href === '/dashboard') return url === '/dashboard';
        return url.startsWith(href);
    };

    return (
        <aside
            className={`app-sidebar fixed inset-y-0 left-0 z-30 flex flex-col overflow-x-hidden border-r border-excel-border bg-excel-surface transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-900 ${
                collapsed ? 'w-16' : 'w-64'
            } ${
                open ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
            <div className={`flex h-16 items-center border-b border-excel-border dark:border-gray-700 ${collapsed ? 'justify-center px-0' : 'justify-between gap-2 px-4'}`}>
                {collapsed ? (
                    <img src="/favicon/favicon-32x32.png" alt="Seguimiento" className="h-8 w-8 rounded" />
                ) : (
                    <div className="flex min-w-0 items-center gap-2.5">
                        <img src="/favicon/favicon-32x32.png" alt="Seguimiento" className="h-8 w-8 rounded" />
                        <div className="min-w-0 leading-tight">
                            <h1 className="truncate text-sm font-semibold text-excel-text dark:text-gray-100">Seguimiento</h1>
                            <p className="truncate text-[11px] text-excel-muted dark:text-gray-400">Gestión de trámites</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="hidden h-7 w-7 items-center justify-center rounded text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 md:flex"
                    title={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
                    aria-label={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
                >
                    <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
                </button>
                <button
                    onClick={onClose}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-excel-muted hover:bg-excel-surface-2 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
                    aria-label="Cerrar menú"
                >
                    <Icon name="close" size={16} />
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-2 py-3">
                {menuItems.map((item) => {
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center rounded-md border-l-2 px-2.5 py-2 text-[13px] font-medium transition-colors ${
                                collapsed ? 'justify-center' : 'gap-2.5'
                            } ${
                                active
                                    ? 'border-excel-green bg-excel-green-light text-excel-green dark:bg-excel-green/15 dark:text-[#6fd394]'
                                    : 'border-transparent text-excel-muted hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                            }`}
                        >
                            <Icon name={item.icon} size={18} className="flex-shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="space-y-1 border-t border-excel-border p-2 dark:border-gray-700">
                <button
                    onClick={toggle}
                    title={collapsed ? (theme === 'dark' ? 'Modo claro' : 'Modo oscuro') : undefined}
                    className={`flex w-full items-center rounded-md px-2.5 py-2 text-[13px] font-medium text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 ${
                        collapsed ? 'justify-center' : 'gap-2.5'
                    }`}
                >
                    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
                </button>
            </div>
        </aside>
    );
}
