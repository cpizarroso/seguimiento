import { router } from '@inertiajs/react';

interface TramiteFilters {
    search?: string;
    estado?: string;
    funcionario_id?: string;
}

export const tramiteService = {
    list(filters?: TramiteFilters) {
        router.get('/tramites', filters || {}, {
            preserveState: true,
            preserveScroll: true,
        });
    },

    store(data: Record<string, unknown>) {
        router.post('/tramites', data);
    },

    update(id: number, data: Record<string, unknown>) {
        router.put(`/tramites/${id}`, data);
    },

    destroy(id: number) {
        router.delete(`/tramites/${id}`);
    },
};
