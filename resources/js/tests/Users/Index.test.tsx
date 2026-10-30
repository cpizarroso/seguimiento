import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerGet = vi.fn();
let mockUrl = '/users';
let mockPermisos: string[] = ['usuarios.consulta', 'usuarios.creacion', 'usuarios.edicion', 'usuarios.baja'];
let mockUserId = 99;

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: {
        get: (...args: unknown[]) => routerGet(...args),
        put: vi.fn(),
        delete: vi.fn(),
    },
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
    usePage: () => ({
        url: mockUrl,
        props: { auth: { user: { id: mockUserId, name: 'Admin', permisos: mockPermisos } } },
    }),
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

import UsersIndex from '@/pages/Users/Index';

function props() {
    return {
        users: {
            data: [
                { id: 1, name: 'Ana Pérez', username: 'ana.perez', email: 'ana@ejemplo.gob.bo', persona_id: 5, activo: true, persona: null, roles: [] },
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
        mockPermisos = ['usuarios.consulta', 'usuarios.creacion', 'usuarios.edicion', 'usuarios.baja'];
        mockUserId = 99;
    });

    it('muestra el buscador y las opciones de filtros', () => {
        render(React.createElement(UsersIndex, props() as any));

        expect(screen.getByLabelText('Buscar usuarios')).toBeInTheDocument();
        expect(screen.getByLabelText('Rol')).toBeInTheDocument();
        expect(screen.getByLabelText('Área')).toBeInTheDocument();
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

    it('limpiar reinicia todos los filtros', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Rol'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(routerGet).toHaveBeenLastCalledWith('/users', {}, expect.anything());
    });

    it('abre el modal de reseteo de contraseña desde la acción de la fila', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Resetear contraseña de Ana Pérez' }));

        expect(screen.getByText('Resetear contraseña')).toBeInTheDocument();
        expect(screen.getByLabelText(/^Contraseña/)).toBeInTheDocument();
    });

    it('oculta la acción de reseteo sin permiso de edición', () => {
        mockPermisos = ['usuarios.consulta'];

        render(React.createElement(UsersIndex, props() as any));

        expect(screen.queryByRole('button', { name: 'Resetear contraseña de Ana Pérez' })).not.toBeInTheDocument();
    });

    it('muestra el estado del usuario y abre el modal de desactivación', () => {
        render(React.createElement(UsersIndex, props() as any));

        expect(screen.getByText('Activo')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Desactivar usuario Ana Pérez' }));

        expect(screen.getByText('Desactivar usuario')).toBeInTheDocument();
    });

    it('oculta la acción de estado para la propia cuenta', () => {
        mockUserId = 1;

        render(React.createElement(UsersIndex, props() as any));

        expect(screen.queryByRole('button', { name: 'Desactivar usuario Ana Pérez' })).not.toBeInTheDocument();
    });

    it('oculta las acciones sin permisos de creación, edición y baja', () => {
        mockPermisos = ['usuarios.consulta'];

        render(React.createElement(UsersIndex, props() as any));

        expect(screen.queryByRole('button', { name: 'Nuevo usuario' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ver' })).toBeInTheDocument();
    });

    it('muestra el reporte de acceso después de crear un usuario', () => {
        render(React.createElement(UsersIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Nuevo usuario' }));
        fireEvent.click(screen.getByRole('button', { name: 'Simular alta' }));

        expect(screen.getByText('Usuario creado')).toBeInTheDocument();
        expect(screen.getByLabelText('Reporte de acceso')).toHaveTextContent('Contraseña: X48213!');
    });
});
