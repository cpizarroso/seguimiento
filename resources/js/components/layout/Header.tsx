import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { BadgeEntorno } from '@/components/features/sistema/BadgeEntorno';
import { Icon } from '@/components/ui/Icon';

interface HeaderProps {
    onMenuClick: () => void;
}

const sectionNames: Record<string, string> = {
    dashboard: 'Dashboard',
    tramites: 'Trámites',
    personas: 'Personas',
    areas: 'Áreas y Puestos',
    reporte: 'Reporte',
    configuracion: 'Configuración',
    users: 'Usuarios',
    roles: 'Roles',
    profile: 'Mi Perfil',
};

export function Header({ onMenuClick }: HeaderProps) {
    const { auth } = usePage().props;
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const section = url.split('/').filter(Boolean)[0] ?? 'dashboard';
    const sectionName = sectionNames[section] ?? 'Sistema';
    const userName = auth.user?.name || 'Usuario';

    useEffect(() => {
        setMenuOpen(false);
    }, [url]);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClick = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen]);

    return (
        <header className="app-header flex h-14 items-center justify-between border-b border-excel-border bg-excel-surface px-3 dark:border-gray-700 dark:bg-gray-900 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
                <button
                    onClick={onMenuClick}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 md:hidden"
                    aria-label="Abrir menú"
                >
                    <Icon name="menu" size={20} />
                </button>
                <div className="flex min-w-0 items-center gap-2 text-xs">
                    <span className="hidden text-excel-muted dark:text-gray-500 sm:inline">Sistema</span>
                    <Icon name="chevron-right" size={12} className="hidden text-excel-muted/60 dark:text-gray-600 sm:block" />
                    <span className="truncate font-semibold text-excel-text dark:text-gray-200">{sectionName}</span>
                </div>
            </div>

            <div className="flex items-center gap-2.5">
                <div className="hidden sm:block">
                    <BadgeEntorno />
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-label="Menú de usuario"
                        className="flex items-center gap-2.5 rounded-md border border-transparent px-1.5 py-1 transition-colors hover:border-excel-border hover:bg-excel-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-excel-green/40 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-excel-green/30 bg-excel-green-light text-xs font-bold text-excel-green dark:border-excel-green/40 dark:bg-excel-green/15 dark:text-[#6fd394]">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                        <span className="hidden flex-col text-left leading-tight sm:flex">
                            <span className="max-w-[180px] truncate text-xs font-semibold text-excel-text dark:text-gray-200">
                                {userName}
                            </span>
                            <span className="max-w-[180px] truncate text-[11px] text-excel-muted dark:text-gray-400">
                                {auth.user?.puesto ?? auth.user?.area ?? 'Sesión activa'}
                            </span>
                        </span>
                        <Icon
                            name="chevron-down"
                            size={14}
                            className={`hidden flex-shrink-0 text-excel-muted transition-transform sm:block ${menuOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {menuOpen && (
                        <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-md border border-excel-border bg-excel-surface py-1 shadow-xl dark:border-gray-600 dark:bg-gray-800"
                        >
                            <div className="border-b border-excel-border px-3 py-2.5 dark:border-gray-700">
                                <p className="truncate text-sm font-semibold text-excel-text dark:text-gray-100">{userName}</p>
                                <p className="mt-0.5 truncate text-xs text-excel-muted dark:text-gray-400">
                                    {auth.user?.email ?? 'Sesión activa'}
                                </p>
                            </div>

                            <Link
                                href="/profile"
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-excel-muted transition-colors hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                            >
                                <Icon name="user" size={16} className="flex-shrink-0" />
                                Mi Perfil
                            </Link>

                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-excel-red transition-colors hover:bg-[#fdecea] dark:text-[#f28b82] dark:hover:bg-excel-red/10"
                            >
                                <Icon name="logout" size={16} className="flex-shrink-0" />
                                Cerrar sesión
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
