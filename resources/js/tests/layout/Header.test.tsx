import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    usePage: () => ({
        url: '/dashboard',
        props: {
            auth: {
                user: { name: 'Ana Pérez', email: 'ana@ejemplo.gob.bo', puesto: 'Jefa de área' },
            },
            sistema: {
                modo: 'dev',
                entorno: 'local',
                etiqueta: 'Desarrollo',
                variante: 'info',
                nota: null,
            },
        },
    }),
}));

import { Header } from '@/components/layout/Header';

describe('Header', () => {
    it('muestra el badge del modo de ejecución', () => {
        render(React.createElement(Header, { onMenuClick: vi.fn() }));

        expect(screen.getByText('Desarrollo')).toBeInTheDocument();
    });

    it('muestra Mi Perfil y Cerrar sesión en el menú del usuario', () => {
        render(React.createElement(Header, { onMenuClick: vi.fn() }));

        expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Menú de usuario' }));

        expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
        expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
    });
});
