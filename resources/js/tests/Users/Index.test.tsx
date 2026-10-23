import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerGet = vi.fn();
let mockUrl = '/users';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: {
        get: (...args: unknown[]) => routerGet(...args),
        delete: vi.fn(),
    },
    useForm: (initial: unknown) => ({
        data: initial,
        setData: vi.fn(),
        reset: vi.fn(),
        clearErrors: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
    }),
    usePage: () => ({ url: mockUrl, props: { auth: { user: { id: 1, name: 'Admin' } } } }),
}));

vi.mock('@/components/ui/SearchableSelect', () => ({
    SearchableSelect: ({ ariaLabel, options, value, onChange, placeholder }: any) =>
        React.createElement('select', {
            'aria-label': ariaLabel,
            value: value ?? '',
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value || null),
        },
            React.createElement('option', { value: '' }, placeholder),
            options.map((opcion: any) =>
                React.createElement('option', { key: opcion.value, value: opcion.value }, opcion.label),
            ),
        ),
}));

vi.mock('@/components/features/users/UserForm', () => ({
    UserForm: () => null,
}));

import UsersIndex from '@/pages/Users/Index';

function props() {
    return {
        users: {
            data: [
                { id: 1, name: 'Ana Pérez', email: 'ana@ejemplo.gob.bo', phone: null, profesion: null, persona_id: null, persona: null, roles: [] },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 10, total: 1, from: 1, to: 1 },
        },
        roles: { data: [{ id: 2, nombre: 'Supervisor' }] },
        personas: { data: [] },
        areas: { data: [{ id: 7, nombre: 'Dirección Legal', codigo: 'DLA' }] },
    };
}

describe('Users Index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUrl = '/users';
    });

    it('muestra el buscador y las opciones de filtros', () => {
        render(React.createElement(UsersIndex, props() as any));

        expect(screen.getByLabelText('Buscar usuarios')).toBeInTheDocument();
        expect(screen.getByLabelText('Rol')).toBeInTheDocument();
        expect(screen.getByLabelText('Área')).toBeInTheDocument();
        expect(screen.getByLabelText('Vinculación')).toBeInTheDocument();
        expect(screen.getByText('DLA · Dirección Legal')).toBeInTheDocument();
    });

    it('busca por texto al presionar el botón', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Buscar usuarios'), { target: { value: 'Ana' } });
        fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/users',
            expect.objectContaining({ search: 'Ana' }),
            expect.anything(),
        );
    });

    it('filtra por rol', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Rol'), { target: { value: '2' } });

        expect(routerGet).toHaveBeenCalledWith(
            '/users',
            expect.objectContaining({ role_id: '2', page: 1 }),
            expect.anything(),
        );
    });

    it('filtra por área', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Área'), { target: { value: '7' } });

        expect(routerGet).toHaveBeenCalledWith(
            '/users',
            expect.objectContaining({ area_id: '7', page: 1 }),
            expect.anything(),
        );
    });

    it('filtra por vinculación con persona', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Vinculación'), { target: { value: '1' } });

        expect(routerGet).toHaveBeenCalledWith(
            '/users',
            expect.objectContaining({ con_persona: '1', page: 1 }),
            expect.anything(),
        );
    });

    it('limpiar reinicia todos los filtros', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Rol'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(routerGet).toHaveBeenLastCalledWith('/users', {}, expect.anything());
    });
});
