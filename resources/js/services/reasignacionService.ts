import { router } from '@inertiajs/react';

interface OpcionesInertia {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errores: Record<string, string>) => void;
    onFinish?: () => void;
}

export const reasignacionService = {
    urls: {
        index: '/reasignaciones',
        crear: '/reasignaciones',
        aprobar: (id: number) => `/reasignaciones/${id}/aprobar`,
        rechazar: (id: number) => `/reasignaciones/${id}/rechazar`,
        cancelar: (id: number) => `/reasignaciones/${id}`,
    },

    listar(params: Record<string, string | number | undefined>, opciones: OpcionesInertia = {}) {
        router.get(reasignacionService.urls.index, params, {
            preserveState: true,
            preserveScroll: true,
            ...opciones,
        });
    },

    solicitar(datos: { tramite_id: number; motivo: string }, opciones: OpcionesInertia = {}) {
        router.post(reasignacionService.urls.crear, datos, {
            preserveScroll: true,
            ...opciones,
        });
    },

    aprobar(id: number, glosaRespuesta: string, opciones: OpcionesInertia = {}) {
        router.put(
            reasignacionService.urls.aprobar(id),
            { glosa_respuesta: glosaRespuesta },
            { preserveScroll: true, ...opciones },
        );
    },

    rechazar(id: number, glosaRespuesta: string, opciones: OpcionesInertia = {}) {
        router.put(
            reasignacionService.urls.rechazar(id),
            { glosa_respuesta: glosaRespuesta },
            { preserveScroll: true, ...opciones },
        );
    },

    cancelar(id: number, opciones: OpcionesInertia = {}) {
        router.delete(reasignacionService.urls.cancelar(id), {
            preserveScroll: true,
            ...opciones,
        });
    },
};
