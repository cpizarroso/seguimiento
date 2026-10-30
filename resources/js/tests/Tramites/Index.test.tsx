import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const routerGet = vi.fn();
const routerReload = vi.fn();
let mockUrl = '/tramites';
let mockAuthUser: any = { id: 1, name: 'Test', area_id: null };

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: { get: (...args: unknown[]) => routerGet(...args), reload: (...args: unknown[]) => routerReload(...args) },
    useForm: (initial: unknown) => ({
        data: initial,
        setData: vi.fn(),
        reset: vi.fn(),
        clearErrors: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
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
    Table: ({ columns, data, emptyMessage, onSort, selectable, selectedKeys = [], onSelectionChange, isRowSelectable = () => true, getRowLabel }: any) =>
        React.createElement('div', null,
            data.length === 0
                ? React.createElement('p', null, emptyMessage)
                : React.createElement('table', null,
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            selectable
                                ? React.createElement('th', { key: '__select__' },
                                    React.createElement('input', { type: 'checkbox', 'aria-label': 'Seleccionar todos' })
                                )
                                : null,
                            columns.map((col: any) =>
                                React.createElement('th', { key: col.key },
                                    col.sortable && onSort
                                        ? React.createElement('button', {
                                            type: 'button',
                                            onClick: () => onSort(col.key),
                                        }, col.header)
                                        : col.header
                                )
                            )
                        )
                    ),
                    React.createElement('tbody', null,
                        data.map((row: any, i: number) =>
                            React.createElement('tr', { key: row.id ?? i },
                                selectable
                                    ? React.createElement('td', { key: '__select__' },
                                        React.createElement('input', {
                                            type: 'checkbox',
                                            'aria-label': getRowLabel ? getRowLabel(row) : `Seleccionar fila ${row.id ?? i}`,
                                            checked: selectedKeys.includes(row.id),
                                            disabled: !isRowSelectable(row),
                                            onChange: () => {
                                                const next = selectedKeys.includes(row.id)
                                                    ? selectedKeys.filter((key: number) => key !== row.id)
                                                    : [...selectedKeys, row.id];
                                                onSelectionChange?.(next);
                                            },
                                        })
                                    )
                                    : null,
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

vi.mock('@/components/ui/SearchableSelect', () => ({
    SearchableSelect: ({ ariaLabel, label, options, value, onChange, placeholder }: any) =>
        React.createElement('div', null,
            React.createElement('label', { htmlFor: 'filtro-area-mock' }, label ?? ariaLabel),
            React.createElement('select', {
                id: 'filtro-area-mock',
                'aria-label': ariaLabel ?? label,
                value: value ?? '',
                onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value || null),
            },
                React.createElement('option', { value: '' }, placeholder),
                options.map((opcion: any) =>
                    React.createElement('option', { key: opcion.value, value: opcion.value }, opcion.label)
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
    numero_completo: 'DLA-0007/2026',
    year: 2026,
    fecha: '10/06/2026',
    descripcion: 'Solicitud de prueba',
    numero_diamante: 'DIA-1234',
    estado: 'proceso',
    urgente: true,
    ultima_respuesta: null,
    dias_transcurridos: 2,
    created_at: '10/06/2026 08:00',
    area: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
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
                { id: 7, nombre: 'Dirección Legal', codigo: 'DLA' },
                { id: 9, nombre: 'Administración', codigo: 'ADM' },
            ],
        },
    };
}

function propsDerivable() {
    const base = props();

    return {
        ...base,
        tramites: {
            ...base.tramites,
            data: [
                {
                    ...mockTramite,
                    asignado: { id: 1, name: 'Test' },
                    derivaciones: [
                        {
                            ...mockTramite.derivaciones[0],
                            estado: 'recepcionado',
                            derivado_a: { id: 1, name: 'Test' },
                        },
                    ],
                },
            ],
        },
    };
}

function propsRecepcionable() {
    const base = props();

    return {
        ...base,
        tramites: {
            ...base.tramites,
            data: [
                {
                    ...mockTramite,
                    estado: 'proceso',
                    asignado: { id: 1, name: 'Test' },
                    derivaciones: [
                        {
                            ...mockTramite.derivaciones[0],
                            estado: 'derivado',
                            derivado_a: { id: 1, name: 'Test' },
                        },
                    ],
                },
            ],
        },
    };
}

function propsConDestino() {
    const base = props();

    return {
        ...base,
        tramites: {
            ...base.tramites,
            data: [
                {
                    ...mockTramite,
                    derivaciones: [
                        {
                            ...mockTramite.derivaciones[0],
                            derivado_a: {
                                id: 5,
                                name: 'Ana Pérez',
                                persona: {
                                    area: { id: 9, nombre: 'Administración', codigo: 'ADM' },
                                    puesto_activo: { puesto: { nombre: 'JEFE DE ÁREA' } },
                                },
                            },
                        },
                    ],
                },
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

    it('muestra las columnas en el orden pedido y sin las columnas viejas', () => {
        render(React.createElement(TramitesIndex, props() as any));

        for (const header of ['NRO', 'Fecha', 'Área', 'Descripción', 'Última derivación', 'Días', 'Estado', 'Recepción']) {
            expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
        }

        expect(screen.queryByRole('columnheader', { name: 'Urgente' })).not.toBeInTheDocument();
        expect(screen.queryByRole('columnheader', { name: 'N° Diamante' })).not.toBeInTheDocument();

        const headers = screen.getAllByRole('columnheader').map((th) => th.textContent);

        expect(headers.at(-1)).toBe('Recepción');

        expect(screen.queryByText('Gestión')).not.toBeInTheDocument();
        expect(screen.queryByText('Última actuación')).not.toBeInTheDocument();
        expect(screen.queryByText('Derivado a')).not.toBeInTheDocument();
        expect(screen.queryByText('Respuesta')).not.toBeInTheDocument();
    });

    it('agrupa nro diamante, descripción y urgente en la columna descripción', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByText(/Diamante:/)).toBeInTheDocument();
        expect(screen.getByText('DIA-1234')).toBeInTheDocument();
        expect(screen.getByText('Solicitud de prueba')).toBeInTheDocument();
        expect(screen.getByText('Urgente', { selector: 'span' })).toBeInTheDocument();
    });

    it('la columna nro muestra solo el numero sin codigo de area ni gestion', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.queryByText('DLA-0007/2026')).not.toBeInTheDocument();
        expect(screen.getByText('10/06/2026')).toBeInTheDocument();
        expect(screen.queryByText('10/06/2026 08:00')).not.toBeInTheDocument();
    });
    it('muestra la ultima derivacion con numero, fecha, glosa y destino', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByText(/N° 3/)).toBeInTheDocument();
        expect(screen.getByText(/Se deriva para revisión/)).toBeInTheDocument();
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText(/11\/06\/2026 09:00/)).toBeInTheDocument();
    });

    it('muestra el área y el puesto del usuario destino en la última derivación', () => {
        render(React.createElement(TramitesIndex, propsConDestino() as any));

        const celda = screen.getByText(/N° 3/).closest('td');

        expect(celda).not.toBeNull();

        const detalle = within(celda as HTMLElement);

        expect(detalle.getByText('ADM · Administración')).toBeInTheDocument();
        expect(detalle.getByText('JEFE DE ÁREA')).toBeInTheDocument();
    });

    it('muestra el estado de la última derivación abreviado en la columna recepción', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        expect(screen.getByText('Pr', { selector: 'span' })).toBeInTheDocument();
    });

    it('abrevia recepcionado como RE', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        expect(screen.getByText('RE', { selector: 'span' })).toBeInTheDocument();
    });

    it('muestra un guion cuando el trámite no tiene derivaciones', () => {
        const base = props();

        render(React.createElement(TramitesIndex, {
            ...base,
            tramites: {
                ...base.tramites,
                data: [{ ...mockTramite, derivaciones: [] }],
            },
        } as any));

        expect(screen.queryByText('Pr', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.queryByText('RE', { selector: 'span' })).not.toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('solo muestra el botón Derivar cuando la última derivación fue recepcionada por el usuario', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        expect(screen.getByRole('button', { name: /Derivar$/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^Recepcionar$/ })).not.toBeInTheDocument();
    });

    it('abre el modal de derivación individual desde la fila', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        fireEvent.click(screen.getByRole('button', { name: /Derivar$/ }));

        expect(screen.getByRole('heading', { name: 'Derivar trámite' })).toBeInTheDocument();
    });

    it('muestra el detalle compacto del trámite en el modal de derivación individual', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        fireEvent.click(screen.getByRole('button', { name: /Derivar$/ }));

        const lista = within(screen.getByRole('list', { name: 'Trámites seleccionados' }));

        expect(lista.getByText('DLA-0007/2026')).toBeInTheDocument();
        expect(lista.getByText('Solicitud de prueba')).toBeInTheDocument();
        expect(lista.getByText('DLA · Dirección Legal')).toBeInTheDocument();
        expect(lista.getByText(/Derivación N° 3/)).toBeInTheDocument();
        expect(screen.getByText('1 trámite seleccionado')).toBeInTheDocument();
    });

    it('muestra el botón Recepcionar cuando la derivación está pendiente para el usuario', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        expect(screen.getByRole('button', { name: /^Recepcionar$/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Derivar$/ })).not.toBeInTheDocument();
    });

    it('abre el modal de recepción individual desde la fila', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        fireEvent.click(screen.getByRole('button', { name: /^Recepcionar$/ }));

        expect(screen.getByRole('heading', { name: 'Recepcionar trámite' })).toBeInTheDocument();
        expect(screen.getByText(/Se recepcionará 1 trámite/)).toBeInTheDocument();
    });

    it('muestra el detalle compacto en el modal de recepción masiva', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' }));
        fireEvent.click(screen.getByRole('button', { name: /Recepcionar seleccionados/ }));

        const lista = within(screen.getByRole('list', { name: 'Trámites seleccionados' }));

        expect(lista.getByText('DLA-0007/2026')).toBeInTheDocument();
        expect(lista.getByText('Solicitud de prueba')).toBeInTheDocument();
    });

    it('ordena por estado de la última derivación al hacer clic en la columna', () => {
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Recepción' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ sort: 'estado_derivacion', direction: 'asc', page: 1 }),
            expect.anything(),
        );
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

    it('muestra el filtro de recepcion con Todos activo por defecto', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Por recepcionar' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Recepcionados' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('filtra por tramites por recepcionar y recepcionados', () => {
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Por recepcionar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/tramites',
            expect.objectContaining({ recepcion: 'por_recepcionar', page: 1 }),
            expect.anything(),
        );

        fireEvent.click(screen.getByRole('button', { name: 'Recepcionados' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/tramites',
            expect.objectContaining({ recepcion: 'recepcionados', page: 1 }),
            expect.anything(),
        );
    });

    it('al volver a Todos quita el filtro de recepcion', () => {
        mockUrl = '/tramites?recepcion=por_recepcionar';
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByRole('button', { name: 'Por recepcionar' })).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'Todos' }));

        const filtros = routerGet.mock.calls.at(-1)?.[1] as Record<string, unknown>;

        expect(filtros.recepcion).toBeUndefined();
        expect(filtros.page).toBe(1);
    });

    it('el orden conserva el filtro de recepcion aplicado', () => {
        mockUrl = '/tramites?recepcion=recepcionados';
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Fecha' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/tramites',
            expect.objectContaining({ recepcion: 'recepcionados', sort: 'fecha' }),
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

    it('el chip Hoy filtra los tramites del dia', () => {
        render(React.createElement(TramitesIndex, props() as any));

        const hoy = new Date();
        const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        fireEvent.click(screen.getByRole('checkbox', { name: 'Hoy' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ fecha_desde: iso, fecha_hasta: iso, page: 1 }),
            expect.anything(),
        );
    });

    it('aplica los filtros separados de numero, diamante y descripcion', () => {
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.change(screen.getByLabelText('N° Trámite'), { target: { value: '12' } });
        fireEvent.change(screen.getByLabelText('N° Diamante'), { target: { value: 'DIA-7' } });
        fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'licencia' } });
        fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({
                numero_tramite: '12',
                numero_diamante: 'DIA-7',
                descripcion: 'licencia',
                page: 1,
            }),
            expect.anything(),
        );
    });

    it('aplica el rango elegido en el calendario', () => {
        render(React.createElement(TramitesIndex, props() as any));

        const hoy = new Date();
        const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        const etiqueta = hoy.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar rango de fechas/ }));
        fireEvent.click(screen.getByRole('button', { name: etiqueta }));
        fireEvent.click(screen.getByRole('button', { name: etiqueta }));
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ fecha_desde: iso, fecha_hasta: iso, page: 1 }),
            expect.anything(),
        );
    });

    it('limpiar filtros conserva el orden y quita los filtros', () => {
        mockUrl = '/tramites?numero_diamante=777&area_id=9&recepcion=por_recepcionar&sort=created_at&direction=desc';
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

        expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            { sort: 'created_at', direction: 'desc', page: 1 },
            expect.anything(),
        );
    });

    it('al hacer clic en la columna fecha ordena ascendente', () => {
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.click(screen.getByRole('button', { name: 'Fecha' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/tramites',
            expect.objectContaining({ sort: 'fecha', direction: 'asc', page: 1 }),
            expect.anything(),
        );
    });

    it('el orden conserva los filtros aplicados y no los borradores', () => {
        mockUrl = '/tramites?numero_diamante=777';
        render(React.createElement(TramitesIndex, props() as any));

        fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'borrador' } });
        fireEvent.click(screen.getByRole('button', { name: 'Fecha' }));

        const filtros = routerGet.mock.calls.at(-1)?.[1] as Record<string, unknown>;

        expect(filtros).toEqual(expect.objectContaining({ numero_diamante: '777', sort: 'fecha' }));
        expect(filtros).not.toHaveProperty('descripcion');
    });

    it('refresca las secuencias al abrir el modal de creacion', () => {
        render(React.createElement(TramitesIndex, {
            ...props(),
            areasCreacion: { data: [{ id: 7, nombre: 'Dirección Legal', codigo: 'DLA', predeterminada: true }] },
            secuencias: {},
        } as any));

        fireEvent.click(screen.getByRole('button', { name: 'Nuevo Trámite' }));

        expect(routerReload).toHaveBeenCalledWith({ only: ['secuencias'], data: { year: new Date().getFullYear() } });
    });

    it('muestra el nombre y el codigo del area del tramite', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByText('Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('DLA')).toBeInTheDocument();
    });

    it('solo habilita el checkbox de los tramites derivables por el usuario', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        expect(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' })).toBeEnabled();
    });

    it('deshabilita el checkbox de los tramites no derivables', () => {
        render(React.createElement(TramitesIndex, props() as any));

        expect(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' })).toBeDisabled();
    });

    it('muestra la barra de acciones y abre el modal al seleccionar un tramite', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' }));

        expect(screen.getByText('1 trámite seleccionado')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Derivar seleccionados/ }));

        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Derivar 1 trámite' })).toBeInTheDocument();
    });

    it('limpiar la seleccion oculta la barra de acciones', () => {
        render(React.createElement(TramitesIndex, propsDerivable() as any));

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' }));
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(screen.queryByText('1 trámite seleccionado')).not.toBeInTheDocument();
    });

    it('habilita el checkbox de los tramites pendientes de recepcion', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        expect(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' })).toBeEnabled();
    });

    it('muestra el boton de recepcion masiva y abre su modal', () => {
        render(React.createElement(TramitesIndex, propsRecepcionable() as any));

        expect(screen.queryByRole('button', { name: /Recepcionar seleccionados/ })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar trámite DLA-0007/2026' }));

        fireEvent.click(screen.getByRole('button', { name: /Recepcionar seleccionados/ }));

        expect(screen.getByRole('heading', { name: 'Recepcionar trámite' })).toBeInTheDocument();
        expect(screen.getByText(/Se recepcionará 1 trámite/)).toBeInTheDocument();
    });
});
