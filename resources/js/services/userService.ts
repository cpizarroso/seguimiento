import { router } from '@inertiajs/react';

interface OpcionesInertia {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errores: Record<string, string>) => void;
    onFinish?: () => void;
}

export interface ResetPasswordPayload {
    password: string;
    password_confirmation: string;
}

export const userService = {
    urls: {
        index: '/users',
        resetPassword: (id: number) => `/users/${id}/reset-password`,
        estado: (id: number) => `/users/${id}/estado`,
    },

    resetPassword(id: number, datos: ResetPasswordPayload, opciones: OpcionesInertia = {}) {
        router.put(userService.urls.resetPassword(id), { ...datos }, { preserveScroll: true, ...opciones });
    },

    cambiarEstado(id: number, activo: boolean, opciones: OpcionesInertia = {}) {
        router.put(userService.urls.estado(id), { activo }, { preserveScroll: true, ...opciones });
    },
};
