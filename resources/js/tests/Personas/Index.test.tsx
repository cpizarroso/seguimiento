import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { AreaOpcion, PaginatedData, Persona, Puesto } from '@/types/generated/Tramite';

const routerDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
    router: {
        get: vi.fn(),
        put: vi.fn(),
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

import PersonasIndex from '@/pages/Personas/Index';

const areas: AreaOpcion[] = [
    {
        id: 1,
        nombre: 'Dirección Legal',
        codigo: 'DLA',
        path: 'Secretaría / Dirección Legal',
        depth: 1,
        activo: true,
        disabled: false,
    },
];

const puesto: Puesto = {
    id: 10,
    nombre: 'SECRETARIA',
    descripcion: null,
    codigo: 'DLA-SEC',
    activo: true,
    area_id: 1,
    area: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA', descripcion: null, activo: true, area_padre_id: null, user_id: null },
    personas_count: 1,
    usuarios_count: 1,
};

const persona: Persona = {
    id: 5,
    nombres: 'Erika',
    apellidos: 'Rodriguez',
    nombre_completo: 'Erika Rodriguez',
    ci: '1234567',
    telefono: '70000000',
    correo: 'erodriguez@ejemplo.gob.bo',
    direccion: 'La Paz',
    activo: true,
    puesto_activo: {
        id: 20,
        persona_id: 5,
        puesto_id: 10,
        puesto,
        fecha_inicio: '2026-01-01',
        fecha_fin: null,
        vigente: true,
    },
    area: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
    user: { id: 3, name: 'Erika Rodriguez', email: 'erodriguez@ejemplo.gob.bo' },
    historial_puestos: [
        {
            id: 20,
            persona_id: 5,
            puesto_id: 10,
            puesto,
            fecha_inicio: '2026-01-01',
            fecha_fin: null,
            vigente: true,
        },
    ],
};

const personas: PaginatedData<Persona> = {
    data: [persona],
    meta: {
        current_page: 1,
        last_page: 1,
        from: 1,
        to: 1,
        total: 1,
        per_page: 10,
    },
};

function renderPage() {
    render(
        React.createElement(PersonasIndex, {
            personas,
            areas,
            puestos: [puesto],
        }),
    );
}

describe('Personas/Index', () => {
    it('muestra personas, contacto, área, puesto y usuario', () => {
        renderPage();

        expect(screen.getByText('Rodriguez, Erika')).toBeInTheDocument();
        expect(screen.getByText('CI: 1234567')).toBeInTheDocument();
        expect(screen.getAllByText('erodriguez@ejemplo.gob.bo').length).toBeGreaterThan(0);
        expect(screen.getByText('Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('SECRETARIA')).toBeInTheDocument();
        expect(screen.getByText('Activa')).toBeInTheDocument();
    });

    it('abre el detalle con el historial de puestos', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Ver' }));

        expect(screen.getByRole('heading', { name: 'Detalle de la persona' })).toBeInTheDocument();
        expect(screen.getByText('Historial de puestos')).toBeInTheDocument();
        expect(screen.getByText('2026-01-01 → vigente')).toBeInTheDocument();
        expect(screen.getByText('Vigente')).toBeInTheDocument();
    });

    it('abre el modal de edición con los datos de la persona', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        expect(screen.getByRole('heading', { name: 'Editar persona' })).toBeInTheDocument();
        expect(screen.getByDisplayValue('Erika')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Actualizar persona' })).toBeInTheDocument();
    });

    it('abre el modal de nueva persona', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Nueva persona' }));

        expect(screen.getByRole('heading', { name: 'Nueva persona' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Crear persona' })).toBeInTheDocument();
    });

    it('pide confirmación antes de eliminar', () => {
        renderPage();

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

        expect(screen.getByRole('heading', { name: 'Confirmar eliminación' })).toBeInTheDocument();
        expect(routerDelete).not.toHaveBeenCalled();
    });
});
