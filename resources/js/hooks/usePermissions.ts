import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage().props as unknown as {
        auth: { user: { permisos: string[] } | null };
    };

    const permisos = auth?.user?.permisos ?? [];

    const can = (module: string, action = 'consulta'): boolean => {
        return permisos.includes(`${module}.${action}`);
    };

    const canAny = (module: string, actions: string[]): boolean => {
        return actions.some((action) => can(module, action));
    };

    return { permisos, can, canAny };
}
