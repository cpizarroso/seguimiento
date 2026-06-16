import { router } from '@inertiajs/react';

export const authService = {
    login(data: { email: string; password: string }) {
        router.post('/login', data);
    },

    logout() {
        router.post('/logout');
    },
};
