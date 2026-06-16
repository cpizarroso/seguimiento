import { usePage } from '@inertiajs/react';

export function useSidebar() {
    const { url } = usePage();

    const isActive = (href: string) => {
        if (href === '/dashboard') return url === '/dashboard';
        return url.startsWith(href);
    };

    return { isActive };
}
