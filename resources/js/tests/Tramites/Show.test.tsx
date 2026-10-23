import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    useForm: (initial: unknown) => ({
        data: initial,
        setData: vi.fn(),
        reset: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
    }),
    usePage: () => ({
        url: '/tramites/1',
        props: {
            auth: {
                user: { id: 1, name: 'Test', role: 'secretaria', permisos: [] },
            },
        },
    }),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: () => true }),
}));

vi.mock('@/components/layout/DashboardLayout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', null, children),
}));

vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ open, children, title }: any) =>
        open
            ? React.createElement('div', { 'data-testid': 'modal' },
                React.createElement('h3', null, title),
                children,
            )
            : null,
}));

vi.mock('@/components/features/tramites/TramiteTimeline', () => ({
    TramiteTimeline: () => null,
}));

vi.mock('@/components/features/derivaciones/DerivarModal', () => ({
    DerivarModal: ({ open }: { open: boolean }) =>
        open ? React.createElement('div', { 'data-testid': 'derivar-modal' }) : null,
}));

import TramitesShow from '@/pages/Tramites/Show';

function tramite(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        numero_tramite: 1,
        numero_formateado: '0001',
        numero_completo: 'DLA-0001/2026',
        year: 2026,
        fecha: '10/06/2026',
        descripcion: 'Solicitud de prueba',
        numero_diamante: null,
        estado: 'proceso',
        urgente: false,
        ultima_respuesta: null,
        area: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
        area_id: 1,
        creador: { id: 1, name: 'Test' },
        asignado: { id: 1, name: 'Test' },
        derivaciones: [
            {
                id: 10,
                numero_derivacion: 1,
                derivado_de: { id: 1, name: 'Test' },
                derivado_a: { id: 1, name: 'Test' },
                fecha_derivacion: '10/06/2026 08:00',
                glosa_derivacion: 'Recepción',
                fecha_recepcion: '10/06/2026 08:00',
                glosa_recepcion: null,
                estado: 'recepcionado',
                dias_en_derivacion: 0,
                actuaciones: [],
            },
        ],
        actuaciones: [],
        ...overrides,
    };
}

describe('Tramites Show', () => {
    it('permite derivar y observar un tramite recepcionado por el usuario', () => {
        render(React.createElement(TramitesShow, { tramite: tramite() } as any));

        expect(screen.getByRole('button', { name: 'Observar' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Derivar' }));

        expect(screen.getByTestId('derivar-modal')).toBeInTheDocument();
    });

    it('no ofrece derivar ni observar un tramite asignado a otra persona', () => {
        render(React.createElement(TramitesShow, {
            tramite: tramite({ asignado: { id: 2, name: 'Otra' } }),
        } as any));

        expect(screen.queryByRole('button', { name: 'Derivar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Observar' })).not.toBeInTheDocument();
    });
});
