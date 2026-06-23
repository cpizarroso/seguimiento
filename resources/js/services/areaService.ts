import { router } from '@inertiajs/react';

export const areaService = {
    list(filters?: { search?: string; per_page?: number }) {
        router.get('/areas', filters || {}, {
            preserveState: true,
            preserveScroll: true,
        });
    },

    store(data: Record<string, unknown>) {
        router.post('/areas', data);
    },

    update(id: number, data: Record<string, unknown>) {
        router.put(`/areas/${id}`, data);
    },

    destroy(id: number) {
        router.delete(`/areas/${id}`);
    },
};
