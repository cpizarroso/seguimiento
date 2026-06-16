import { usePage } from '@inertiajs/react';
import type { User } from '@/types/generated/User';

export function useAuth() {
    const { auth } = usePage().props;

    return {
        user: auth.user as User | null,
        isAuthenticated: auth.user !== null,
    };
}
