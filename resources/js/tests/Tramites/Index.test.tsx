import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const routerGet = vi.fn();
let mockUrl = '/tramites';
let mockAuthUser: any = { id: 1, name: 'Test', area_id: null };

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: { get: (...args: unknown[]) => routerGet(...args) },
    useForm: (initial: unknown) => ({
        data: initial,
        setData: vi.fn(),
        reset: vi.fn(),
    }),
    usePage: () => ({ url: mockUrl, props: { auth: { user: mockAuthUser } } }),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: () => true }),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, variant }: any) =>
        React.createElement('button', { onClick, 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/Badge', () => ({
    Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) =>
        React.createElement('span', { 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/Card', () => ({
    Card: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', null, children),
}));

vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ open, children, title }: any) =>
        open ? React.createElement('div', { 'data-testid': 'modal' },
            React.createElement('h3', null, title),
            children
        ) : null,
}));

vi.mock('@/components/ui/Table', () => ({
    Table: ({ columns, data, emptyMessage }: any) =>
        React.createElement('div', null,
            data.length === 0
                ? React.createElement('p', null, emptyMessage)
                : React.createElement('table', null,
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            columns.map((col: any) =>
                                React.createElement('th', { key: col.key }, col.header)
                            )
                        )
                    ),
                    React.createElement('tbody', null,
                        data.map((row: any, i: number) =>
                            React.createElement('tr', { key: row.id ?? i },
                                columns.map((col: any) =>
                                    React.createElement('td', { key: col.key },
                                        col.render ? col.render(row) : row[col.key]
                                    )
                                )
                            )
                        )
                    )
                )
        ),
}));

vi.mock('@/components/ui/Pagination', () => ({
    Pagination: () => null,
}));

vi.mock('@/components/features/tramites/TramiteForm', () => ({
    TramiteForm: () => null,
}));

import TramitesIndex from '@/pages/Tramites/Index';

const mockTramite = {
    id: 1,
    numero_tramite: 7,
    numero_formateado: '0007',
    numero_completo: 'DLA-7/2026',
    year: 2026,
    fecha: '10/06/2026',
    descripcion: 'Solicitud de prueba',
    numero_diamante: 'DIA-1234',
    estado: 'proceso',
    urgente: true,
    ultima_respuesta: null,
    dias_transcurridos: 2,
    created_at: '10/06/2026 08:00',
    area: { id: 1, nombre: 'Dirección Legal', sigla: 'DLA' },
    area_id: 1,
    creador: null,
    asignado: { id: 2, name: 'Juan Pérez' },
    derivaciones: [
        {
            id: 11,
            numero_derivacion: 3,
            derivado_de: null,
            derivado_a: null,
            fecha_derivacion: '11/06/2026 09:00',
            glosa_derivacion: 'Se deriva para revisión',
            fecha_recepcion: null,
            glosa_recepcion: null,
            estado: 'pendiente',
            dias_en_derivacion: 1,
            actuaciones: [],
        },
    ],
    actuaciones: [],
};

function props(perPage = 10) {
    return {
        tramites: {
            data: [mockTramite],
            meta: {
                current_page: 1,
                last_page: 4,
                per_page: perPage,
                total: 40,
                from: 1,
                to: perPage,
            },
        },
        areas: {
            data: [
                { id: 7, nombre: 'Dirección Legal', sigla: 'DLA' },
                { id: 9, nombre: 'Administración', sigla: 'ADM' },
            ],
        },
    };
}

function mockMatchMedia(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    });
}

describe('Tramites Index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUrl = '/tramites';
        mockAuthUser = { id: 1, name: 'Test', area_id: null };
        mockMatchMedia(false);
    });

    it('muestra las 8 columnas pedidas y no las anteriores', () => {
        render(React.createElement(TramitesIndex, props() as any));

        for (const header of ['NRO', 'Fecha creación', 'N° Diamante', 'Área', 'Descripción', 'Última derivación', 'Días', 'Estado']) {
            expect(screen.getByText(header, { selector: 'th' })).toBeInTheDocument();
        }
        expect(screen.getByText('Urgente', { selector: 'th' })).toBeInTheDocument();
        expect(screen.getByText('Urgente', { selector: 'span' })).toBeInTheDocument();

        expect(screen.queryByText('Gestión')).not.toBeInTheDocument();
        expect(screen.queryByText('Última actuación')).not.toBeInTheDocument();
        expect(screen.queryByText('Derivado a')).not.toBeInTheDocument();
        expect(screen.queryByText('Respuesta')).not.toBeInTheDocument();
    });

    it('la columna nro muestra solo el numero sin sigla ni gestion', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.queryByText('DLA-7/2026')).not.toBeInTheDocument();
        expect(screen.queryByText('10/06/2026')).not.toBeInTheDocument();
        expect(screen.getByText('10/06/2026 08:00')).toBeInTheDocument();
    });
    it('muestra la ultima derivacion con numero, fecha, glosa y destino', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByText(/N° 3/)).toBeInTheDocument();
        expect(screen.getByText(/Se deriva para revisión/)).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('10/06/2026 08:00')).toBeInTheDocument();
    });

    it('en pantalla pequena pide 5 por pagina si no hay per_page explicito', () => {
        mockMatchMedia(true);
        render(React.createElement(TramitesIndex, props(10) as any));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ per_page: 5, page: 1 }),
            expect.anything(),
        );
    });

    it('en pantalla pequena respeta el per_page explicito de la URL', () => {
        mockUrl = '/tramites?per_page=10';
        mockMatchMedia(true);
        render(React.createElement(TramitesIndex, props(10) as any));

        expect(routerGet).not.toHaveBeenCalled();
    });

    it('en pantalla grande no cambia la paginacion', () => {
        mockMatchMedia(false);
        render(React.createElement(TramitesIndex, props(10) as any));

        expect(routerGet).not.toHaveBeenCalled();
    });

    it('muestra el filtro de area con las areas y el check Mi area', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByText('DLA · Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('ADM · Administración')).toBeInTheDocument();
        expect(screen.getByText('Mi área')).toBeInTheDocument();
    });

    it('al elegir un area filtra con area_id', () => {
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Área'), { target: { value: '9' } });

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ area_id: '9', page: 1 }),
            expect.anything(),
        );
    });

    it('el check Mi area filtra por el area del usuario', () => {
        mockAuthUser = { id: 1, name: 'Test', area_id: 7 };
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Mi área' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ area_id: '7', page: 1 }),
            expect.anything(),
        );
    });

    it('el check Mi area esta deshabilitado sin area de usuario', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByRole('checkbox', { name: 'Mi área' })).toBeDisabled();
    });
});
