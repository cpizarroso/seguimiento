import React from 'react';
import { vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    useForm: vi.fn(() => ({
        data: {},
        setData: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
    })),
    usePage: vi.fn(() => ({
        props: {
            auth: { user: null },
            errors: {},
        },
    })),
    router: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
    Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) =>
        React.createElement('a', { href, className }, children),
}));
