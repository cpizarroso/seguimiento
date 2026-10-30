import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PermisosAgrupados, RolRow } from '@/types/roles';

const routerDelete = vi.fn();
let mockPermisos: string[] = ['roles.consulta', 'roles.creacion', 'roles.edicion', 'roles.baja'];

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: {
        delete: (...args: unknown[]) => routerDelete(...args),
    },
    useForm: (initial: unknown) => ({
        data: initial,
        setData: vi.fn(),
        reset: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
    }),
    usePage: () => ({
        url: '/roles',
        props: { auth: { user: { id: 1, name: 'Admin', permisos: mockPermisos } } },
    }),
}));

import RolesIndex from '@/pages/Roles/Index';

const permisosAgrupados: PermisosAgrupados = {
    Dashboard: [
        { id: 1, modulo: 'dashboard', modulo_nombre: 'Dashboard', accion: 'consulta', accion_nombre: 'Consulta' },
    ],
    Roles: [
        { id: 2, modulo: 'roles', modulo_nombre: 'Roles', accion: 'consulta', accion_nombre: 'Consulta' },
        { id: 3, modulo: 'roles', modulo_nombre: 'Roles', accion: 'creacion', accion_nombre: 'Creación' },
    ],
    Backups: [
        { id: 4, modulo: 'backups', modulo_nombre: 'Backups', accion: 'consulta', accion_nombre: 'Consulta' },
    ],
};

function rolesDePrueba(): RolRow[] {
    return [
        {
            id: 1,
            nombre: 'Administrador',
            slug: 'admin',
            descripcion: 'Acceso total',
            es_sistema: true,
            usuarios_count: 3,
            permisos: [
                { id: 2, modulo: 'roles', modulo_nombre: 'Roles', accion: 'consulta', accion_nombre: 'Consulta' },
            ],
        },
        {
            id: 5,
            nombre: 'Supervisor',
            slug: 'supervisor',
            descripcion: null,
            es_sistema: false,
            usuarios_count: 2,
            permisos: [
                { id: 4, modulo: 'backups', modulo_nombre: 'Backups', accion: 'consulta', accion_nombre: 'Consulta' },
            ],
        },
    ];
}

function props() {
    return {
        roles: { data: rolesDePrueba() },
        permisos_agrupados: permisosAgrupados,
    };
}

describe('Roles Index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPermisos = ['roles.consulta', 'roles.creacion', 'roles.edicion', 'roles.baja'];
    });

    it('muestra los roles, el tipo, los usuarios y sus permisos', () => {
        render(React.createElement(RolesIndex, props()));

        expect(screen.getByText('Administrador')).toBeInTheDocument();
        expect(screen.getByText('Sistema')).toBeInTheDocument();
        expect(screen.getByText('Personalizado')).toBeInTheDocument();
        expect(screen.getByText('roles.Consulta')).toBeInTheDocument();
        expect(screen.getByText('backups.Consulta')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('oculta el alta sin permiso de creación', () => {
        mockPermisos = ['roles.consulta'];

        render(React.createElement(RolesIndex, props()));

        expect(screen.queryByRole('button', { name: 'Nuevo Rol' })).not.toBeInTheDocument();
    });

    it('oculta la edición sin permiso de edición', () => {
        mockPermisos = ['roles.consulta'];

        render(React.createElement(RolesIndex, props()));

        expect(screen.queryAllByRole('button', { name: 'Editar' })).toHaveLength(0);
        expect(screen.queryByRole('link', { name: 'Administrador' })).not.toBeInTheDocument();
    });

    it('solo permite eliminar roles personalizados con permiso de baja', () => {
        render(React.createElement(RolesIndex, props()));

        expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(1);
    });

    it('confirma la eliminación indicando los usuarios afectados', () => {
        render(React.createElement(RolesIndex, props()));

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(screen.getByText('¿Eliminar el rol «Supervisor»?')).toBeInTheDocument();
        expect(screen.getByText('2 usuario(s) tienen este rol y perderán sus permisos.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar rol' }));

        expect(routerDelete).toHaveBeenCalledWith('/roles/5', expect.anything());
    });

    it('abre el modal de alta con los permisos agrupados', () => {
        render(React.createElement(RolesIndex, props()));

        fireEvent.click(screen.getByRole('button', { name: 'Nuevo Rol' }));

        expect(screen.getByRole('heading', { name: 'Permisos' })).toBeInTheDocument();
        expect(screen.getByLabelText('Backups: Consulta')).toBeInTheDocument();
    });
});
