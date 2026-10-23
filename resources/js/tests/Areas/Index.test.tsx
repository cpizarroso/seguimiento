import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { AreaOpcion, AreaTreeNode } from '@/types/generated/Tramite';

const routerPut = vi.fn();
const routerDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
        put: (...args: unknown[]) => routerPut(...args),
        delete: (...args: unknown[]) => routerDelete(...args),
        post: vi.fn(),
    },
    useForm: (initial: Record<string, unknown>) => {
        const [data, setDataState] = React.useState<Record<string, unknown>>({ ...initial });
        const setData = (key: string | Record<string, unknown>, value?: unknown) => {
            setDataState((prev) => (typeof key === 'object'
                ? { ...prev, ...key }
                : { ...prev, [key]: value }));
        };
        const form = {
            data,
            errors: {} as Record<string, string>,
            processing: false,
            setData,
            clearErrors: vi.fn(),
            transform: vi.fn(() => form),
            post: vi.fn(),
            put: vi.fn(),
            reset: vi.fn(),
        };

        return form;
    },
    usePage: () => ({ props: { auth: { user: null } } }),
}));

import AreasIndex from '@/pages/Areas/Index';

const areasOpciones: AreaOpcion[] = [
    {
        id: 1,
        nombre: 'Secretaría de Planificación',
        codigo: 'SEM',
        path: 'Secretaría de Planificación',
        depth: 0,
        activo: true,
        disabled: false,
    },
];

const areasTree: AreaTreeNode[] = [
    {
        id: 1,
        nombre: 'Secretaría de Planificación',
        codigo: 'SEM',
        descripcion: 'Área raíz',
        activo: true,
        area_padre_id: null,
        user_id: null,
        responsable: null,
        puestos_count: 1,
        personas_count: 3,
        usuarios_count: 2,
        puestos: [
            {
                id: 10,
                nombre: 'JEFE',
                descripcion: 'Jefatura',
                codigo: 'SEM-JEF',
                activo: true,
                area_id: 1,
                personas_count: 1,
                usuarios_count: 1,
            },
        ],
        children: [
            {
                id: 2,
                nombre: 'Dirección Legal',
                codigo: 'DLA',
                descripcion: null,
                activo: true,
                area_padre_id: 1,
                user_id: null,
                responsable: null,
                puestos_count: 1,
                personas_count: 2,
                usuarios_count: 1,
                puestos: [
                    {
                        id: 11,
                        nombre: 'PROFESIONAL',
                        descripcion: null,
                        codigo: 'DLA-PRO',
                        activo: true,
                        area_id: 2,
                        personas_count: 2,
                        usuarios_count: 1,
                    },
                ],
                children: [],
            },
        ],
    },
];

describe('Areas/Index', () => {
    it('muestra el árbol con áreas, puestos y conteos', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        expect(screen.getByText('Secretaría de Planificación')).toBeInTheDocument();
        expect(screen.getByText('SEM')).toBeInTheDocument();
        expect(screen.getByText('Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('SEM-JEF')).toBeInTheDocument();
        expect(screen.getByText('DLA-PRO')).toBeInTheDocument();
        expect(screen.getByText('3 personas')).toBeInTheDocument();
        expect(screen.getByText('2 usuarios')).toBeInTheDocument();
    });

    it('filtra el árbol por nombre, código o puesto', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        fireEvent.change(
            screen.getByPlaceholderText('Buscar por nombre, código, descripción, responsable o puesto...'),
            { target: { value: 'Secretaría' } },
        );

        expect(screen.getByText('Secretaría de Planificación')).toBeInTheDocument();
        expect(screen.queryByText('Dirección Legal')).not.toBeInTheDocument();
        expect(screen.getByText('SEM-JEF')).toBeInTheDocument();
    });

    it('muestra un mensaje cuando no hay coincidencias', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        fireEvent.change(
            screen.getByPlaceholderText('Buscar por nombre, código, descripción, responsable o puesto...'),
            { target: { value: 'inexistente' } },
        );

        expect(screen.getByText('No se encontraron áreas con ese criterio.')).toBeInTheDocument();
    });

    it('abre el modal de nueva área con los puestos estándar', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Nueva área' }));

        expect(screen.getByText('Puestos estándar a crear')).toBeInTheDocument();
        expect(screen.getByLabelText('JEFE')).toBeChecked();
        expect(screen.getByRole('button', { name: 'Crear área' })).toBeInTheDocument();
    });

    it('abre el modal de nueva subárea desde una tarjeta', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        fireEvent.click(screen.getAllByRole('button', { name: 'Nueva subárea' })[0]);

        expect(screen.getByText('Puestos estándar a crear')).toBeInTheDocument();
    });

    it('pide confirmación antes de eliminar un área', () => {
        render(
            React.createElement(AreasIndex, {
                areasTree,
                areasOpciones,
                responsables: [],
            }),
        );

        fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0]);

        expect(screen.getByRole('heading', { name: 'Confirmar eliminación' })).toBeInTheDocument();
        expect(routerDelete).not.toHaveBeenCalled();
    });
});
