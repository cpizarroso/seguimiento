import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { visit } = vi.hoisted(() => ({ visit: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    router: { visit },
    useForm: (initial: unknown) => ({
        data: typeof initial === 'function' ? (initial as () => unknown)() : initial,
        setData: vi.fn(),
        reset: vi.fn(),
        clearErrors: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
    }),
}));

vi.mock('@/components/features/users/UserForm', () => ({
    UserForm: ({ onCreated }: { onCreated?: (creado: unknown) => void }) =>
        React.createElement(
            'button',
            {
                type: 'button',
                onClick: () => onCreated?.({
                    nombre: 'Ana Pérez',
                    username: 'ana.perez',
                    reporte: 'ACCESO AL SISTEMA\nContraseña: X48213!',
                }),
            },
            'Simular alta',
        ),
}));

import UsersCreate from '@/pages/Users/Create';

describe('Users Create', () => {
    it('muestra el reporte de acceso tras crear y vuelve al listado al cerrarlo', () => {
        render(React.createElement(UsersCreate));

        fireEvent.click(screen.getByRole('button', { name: 'Simular alta' }));

        expect(screen.getByText('Usuario creado')).toBeInTheDocument();
        expect(screen.getByLabelText('Reporte de acceso')).toHaveTextContent('Contraseña: X48213!');

        const cerrar = screen.getAllByRole('button', { name: 'Cerrar' });
        fireEvent.click(cerrar[cerrar.length - 1]);

        expect(visit).toHaveBeenCalledWith('/users');
    });
});
