import '@inertiajs/core';
import type { SistemaInfo } from '@/types/sistema';

interface AuthUser {
    id: number;
    name: string;
    username: string;
    email: string;
    persona_id: number;
    puesto?: string | null;
    area?: string | null;
    area_id?: number | null;
    permisos: string[];
}

declare module '@inertiajs/core' {
    interface InertiaConfig {
        sharedPageProps: {
            auth: {
                user: AuthUser | null;
            };
            sistema: SistemaInfo;
            /** Dominio con el que se construye el email de acceso (APP_USER_DOMAIN). */
            dominio_usuario: string;
        };
        flashDataType: {
            success?: string;
            error?: string;
        };
    }
}
