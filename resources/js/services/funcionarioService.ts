import { router } from '@inertiajs/react';

export const funcionarioService = {
    list(filters?: { search?: string }) {
        router.get('/funcionarios', filters || {}, {
            preserveState: true,
            preserveScroll: true,
        });
    },

    store(data: Record<string, unknown>) {
        router.post('/funcionarios', data);
    },

    update(id: number, data: Record<string, unknown>) {
        router.put(`/funcionarios/${id}`, data);
    },

    destroy(id: number) {
        router.delete(`/funcionarios/${id}`);
    },
};
