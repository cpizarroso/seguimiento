import { usePage } from '@inertiajs/react';
import type { SistemaInfo } from '@/types/sistema';

export interface SistemaBadge extends SistemaInfo {
    /** Texto completo para el tooltip del badge. */
    detalle: string;
}

/**
 * Lee el modo de ejecución compartido por el backend.
 *
 * Devuelve `null` cuando la prop no está disponible (mocks o páginas que no
 * pasan por `HandleInertiaRequests`), para que el badge simplemente no se
 * renderice en lugar de romper la vista.
 */
export function useSistema(): SistemaBadge | null {
    const { sistema } = usePage().props;

    if (!sistema) {
        return null;
    }

    const detalle = `Modo: ${sistema.etiqueta} · APP_ENV: ${sistema.entorno}`;

    return {
        ...sistema,
        detalle: sistema.nota ? `${detalle} · ${sistema.nota}` : detalle,
    };
}
