interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
    funcionario_id: number | null;
    permisos: string[];
}

declare module '@inertiajs/react' {
    interface PageProps {
        auth: {
            user: AuthUser | null;
        };
        flash?: {
            success?: string;
            error?: string;
        };
        [key: string]: unknown;
    }
}
