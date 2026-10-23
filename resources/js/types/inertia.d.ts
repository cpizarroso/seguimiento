import '@inertiajs/core';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    persona_id: number | null;
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
        };
        flashDataType: {
            success?: string;
            error?: string;
        };
    }
}
