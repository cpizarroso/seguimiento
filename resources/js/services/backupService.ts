import { router } from '@inertiajs/react';

interface OpcionesInertia {
    preserveScroll?: boolean;
    onSuccess?: () => void;
    onError?: (errores: Record<string, string>) => void;
    onFinish?: () => void;
}

export const backupService = {
    urls: {
        index: '/backups',
        crear: '/backups',
        restaurar: (id: number) => `/backups/${id}/restaurar`,
        restaurarArchivo: '/backups/restaurar-archivo',
        automatizacion: '/backups/automatizacion',
        descargar: (id: number) => `/backups/${id}/descargar`,
        proteger: (id: number) => `/backups/${id}/proteger`,
        eliminar: (id: number) => `/backups/${id}`,
        eventos: (id: number) => `/backups/${id}/eventos`,
        espacio: '/backups/espacio',
    },

    crear(opciones: OpcionesInertia = {}) {
        router.post(backupService.urls.crear, {}, { preserveScroll: true, ...opciones });
    },

    proteger(id: number, protegido: boolean, opciones: OpcionesInertia = {}) {
        router.put(
            backupService.urls.proteger(id),
            { protegido },
            { preserveScroll: true, ...opciones },
        );
    },

    eliminar(id: number, opciones: OpcionesInertia = {}) {
        router.delete(backupService.urls.eliminar(id), {
            preserveScroll: true,
            ...opciones,
        });
    },

    descargar(id: number) {
        window.location.assign(backupService.urls.descargar(id));
    },

    guardarAutomatizacion(datos: Record<string, string | number | boolean | null | undefined>, opciones: OpcionesInertia = {}) {
        router.put(backupService.urls.automatizacion, datos, {
            preserveScroll: true,
            ...opciones,
        });
    },

    actualizarEspacio() {
        router.reload({ only: ['espacio'] });
    },

    async eventos(id: number): Promise<{ data: Array<Record<string, unknown>> }> {
        const respuesta = await fetch(backupService.urls.eventos(id), {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'same-origin',
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo cargar el historial del backup.');
        }

        return (await respuesta.json()) as { data: Array<Record<string, unknown>> };
    },
};
