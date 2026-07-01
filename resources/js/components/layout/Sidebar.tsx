import { Link, usePage } from '@inertiajs/react';
import { useTheme } from '@/hooks/useTheme';

interface MenuItem {
    label: string;
    href: string;
    icon: string;
    permission?: string;
}

const allMenuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'dashboard' },
    { label: 'Trámites', href: '/tramites', icon: '📋', permission: 'tramites' },
    { label: 'Funcionarios', href: '/funcionarios', icon: '👥', permission: 'funcionarios' },
    { label: 'Áreas y Puestos', href: '/areas', icon: '🗂️', permission: 'areas_puestos' },
    { label: 'Reporte', href: '/reporte', icon: '📈', permission: 'reporte' },
    { label: 'Configuración', href: '/configuracion', icon: '⚙️', permission: 'configuracion' },
    { label: 'Usuarios', href: '/users', icon: '🔐', permission: 'usuarios' },
    { label: 'Roles', href: '/roles', icon: '🛡️', permission: 'roles' },
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
            className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
                collapsed ? 'w-16' : 'w-64'
            } ${
                open ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0`}
        >
            <div className={`flex h-16 items-center border-b border-gray-100 dark:border-gray-700 ${collapsed ? 'justify-center px-0' : 'justify-between gap-2 px-6'}`}>
                {collapsed ? (
                    <span className="text-2xl">📌</span>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📌</span>
                        <h1 className="text-lg font-bold text-patuju-green dark:text-patuju-green">Seguimiento</h1>
                    </div>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="hidden md:flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={collapsed ? 'Expandir sidebar' : 'Minimizar sidebar'}
                >
                    <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={onClose}
                    className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    ✕
                </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
                {menuItems.map((item) => (
                    <div key={item.href} className="relative group">
                        <Link
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                collapsed ? 'justify-center' : 'gap-3'
                            } ${
                                isActive(item.href)
                                    ? 'bg-patuju-green text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-patuju-green/10 dark:hover:bg-patuju-green/20 hover:text-patuju-green dark:hover:text-patuju-green'
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                        {collapsed && (
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg">
                                {item.label}
                            </div>
                        )}
                    </div>
                ))}

            </nav>

            <div className={`border-t border-gray-100 dark:border-gray-700 p-2 space-y-1 ${collapsed ? 'items-center' : ''}`}>
                <div className="relative group">
                    <Link
                        href="/profile"
                        onClick={onClose}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-patuju-green/10 dark:hover:bg-patuju-green/20 hover:text-patuju-green transition-colors ${
                            collapsed ? 'justify-center' : 'gap-3'
                        }`}
                    >
                        <span className="text-lg">👤</span>
                        {!collapsed && <span>Mi Perfil</span>}
                    </Link>
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg">
                            Mi Perfil
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <button
                        onClick={toggle}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-patuju-green/10 dark:hover:bg-patuju-green/20 hover:text-patuju-green transition-colors ${
                            collapsed ? 'justify-center' : 'gap-3'
                        }`}
                    >
                        <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
                    </button>
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg">
                            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-patuju-red/10 hover:text-patuju-red transition-colors ${
                            collapsed ? 'justify-center' : 'gap-3'
                        }`}
                    >
                        <span className="text-lg">🚪</span>
                        {!collapsed && <span>Cerrar sesión</span>}
                    </Link>
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg">
                            Cerrar sesión
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
