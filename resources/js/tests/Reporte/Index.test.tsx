import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const routerGet = vi.fn();
const routerPost = vi.fn();

vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    router: {
        get: (...args: unknown[]) => routerGet(...args),
        post: (...args: unknown[]) => routerPost(...args),
    },
    usePage: () => ({ props: { auth: { user: null } } }),
}));

vi.mock('@/components/ui/Card', () => ({
    Card: ({ children }: { children: React.ReactNode }) =>
        React.createElement('div', null, children),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, disabled }: any) =>
        React.createElement('button', { onClick, disabled }, children),
}));

vi.mock('@/components/ui/Pagination', () => ({
    Pagination: () => null,
}));

import ReporteIndex from '@/pages/Reporte/Index';

const tramite = {
    id: 1,
    numero_tramite: 7,
    numero_formateado: '0007',
    numero_completo: 'DLA-0007/2026',
    year: 2026,
    fecha: '10/03/2026',
    created_at: '10/03/2026 08:00',
    descripcion: 'Solicitud de prueba',
    numero_diamante: 'DIA-1234',
    estado: 'iniciado',
    urgente: true,
    ultima_respuesta: null,
    area: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
    area_id: 1,
    creador: { id: 9, name: 'Carlos Ruiz' },
    asignado: null,
    derivaciones: [],
    actuaciones: [],
};

function baseProps(generado = false) {
    return {
        auth_usuario: { id: 5, name: 'Ana Pérez', area: 'Dirección Legal', area_id: 1 },
        area_reporte: { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
        areas: {
            data: [
                { id: 1, nombre: 'Dirección Legal', codigo: 'DLA' },
                { id: 2, nombre: 'Administración', codigo: 'ADM' },
            ],
        },
        puede_seleccionar_area: false,
        filtros: {
            fecha_desde: generado ? '2026-03-01' : null,
            fecha_hasta: generado ? '2026-03-31' : null,
            hoy: false,
            gestion: 2026,
            numero_tramite: null,
            area_id: 1,
        },
        gestiones: [2026, 2025, 2024, 2023],
        gestion_actual: 2026,
        generado,
        reporte: {
            data: generado ? [tramite] : [],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 15,
                total: generado ? 1 : 0,
                from: generado ? 1 : null,
                to: generado ? 1 : null,
            },
        },
        archivo: null,
        historial: [],
        vista_previa_url: generado ? '/reporte/vista-previa' : null,
        errors: {},
    };
}

describe('Reporte documento', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra el usuario autenticado y su area en el formulario', () => {
        render(React.createElement(ReporteIndex, baseProps() as any));

        expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
        expect(screen.getByText('Dirección Legal')).toBeInTheDocument();
        expect(screen.queryByLabelText('Área del reporte')).not.toBeInTheDocument();
        expect(screen.getByText('Fecha inicial y final')).toBeInTheDocument();
        expect(screen.getByLabelText('Gestión')).toHaveValue('2026');
        expect(screen.queryByText(/Escribe uno o varios números/)).not.toBeInTheDocument();

        const ayuda = screen.getByRole('button', { name: 'Ayuda sobre N° de trámite' });
        fireEvent.mouseEnter(ayuda);

        expect(screen.getByRole('tooltip')).toHaveTextContent(/Escribe uno o varios números/);
        expect(screen.getByRole('switch', { name: 'Solo hoy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Generar' })).toBeInTheDocument();
    });

    it('el tooltip de ayuda se cierra con Escape', () => {
        render(React.createElement(ReporteIndex, baseProps() as any));

        const ayuda = screen.getByRole('button', { name: 'Ayuda sobre N° de trámite' });
        fireEvent.focus(ayuda);
        expect(screen.getByRole('tooltip')).toBeInTheDocument();

        fireEvent.keyDown(ayuda, { key: 'Escape' });
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('el administrador puede seleccionar el area del reporte', () => {
        const props = {
            ...baseProps(true),
            puede_seleccionar_area: true,
        };
        render(React.createElement(ReporteIndex, props as any));

        const selector = screen.getByLabelText('Área del reporte');
        expect(selector).toHaveValue('1');

        fireEvent.change(selector, { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/reporte',
            expect.objectContaining({ area_id: 2, page: 1 }),
            expect.anything(),
        );
    });

    it('genera un reporte solo con el numero de tramite', () => {
        const props = {
            ...baseProps(false),
            puede_seleccionar_area: false,
        };
        render(React.createElement(ReporteIndex, props as any));

        fireEvent.change(screen.getByLabelText('N° de trámite'), { target: { value: '1-5,8' } });
        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/reporte',
            expect.objectContaining({ numero_tramite: '1-5,8', area_id: 1, gestion: 2026, page: 1 }),
            expect.anything(),
        );
    });

    it('permite generar con la gestion actual por defecto', () => {
        render(React.createElement(ReporteIndex, baseProps(false) as any));

        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/reporte',
            expect.objectContaining({ gestion: 2026, page: 1 }),
            expect.anything(),
        );
    });

    it('al elegir otra gestion limpia el rango de fechas', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        fireEvent.change(screen.getByLabelText('Gestión'), { target: { value: '2025' } });
        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/reporte',
            expect.objectContaining({
                gestion: 2025,
                fecha_desde: undefined,
                fecha_hasta: undefined,
            }),
            expect.anything(),
        );
    });

    it('envia 0 para reportar todas las gestiones', () => {
        render(React.createElement(ReporteIndex, baseProps(false) as any));

        fireEvent.change(screen.getByLabelText('Gestión'), { target: { value: '' } });
        fireEvent.change(screen.getByLabelText('N° de trámite'), { target: { value: '7' } });
        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenLastCalledWith(
            '/reporte',
            expect.objectContaining({ gestion: 0, numero_tramite: '7' }),
            expect.anything(),
        );
    });

    it('muestra un error y deshabilita Generar si el numero de tramite es invalido', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        fireEvent.change(screen.getByLabelText('N° de trámite'), { target: { value: '1-' } });

        expect(screen.getByText(/El N° de trámite debe ser un número/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Generar' })).toBeDisabled();
    });

    it('guardar usa el area aplicada aunque se cambie el selector', () => {
        const props = {
            ...baseProps(true),
            puede_seleccionar_area: true,
        };
        render(React.createElement(ReporteIndex, props as any));

        fireEvent.change(screen.getByLabelText('Área del reporte'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar en storage' }));

        expect(routerPost).toHaveBeenCalledWith(
            '/reporte/guardar',
            expect.objectContaining({ area_id: 1, numero_tramite: null }),
        );
    });

    it('al activar Hoy se marca hoy en el calendario y se puede generar', () => {
        render(React.createElement(ReporteIndex, baseProps() as any));

        const hoy = new Date();
        const etiqueta = hoy.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

        fireEvent.click(screen.getByRole('switch', { name: 'Solo hoy' }));

        expect(screen.getByRole('switch', { name: 'Solo hoy' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getAllByText(etiqueta, { exact: false }).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Generar' })).not.toBeDisabled();
    });

    it('al generar llama al servicio con el rango del calendario', () => {
        render(React.createElement(ReporteIndex, baseProps() as any));

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar rango|—/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Hoy' }));
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Generar' }));

        expect(routerGet).toHaveBeenCalledWith(
            '/reporte',
            expect.objectContaining({ page: 1 }),
            expect.anything(),
        );
    });

    it('la vista previa usa un visor pdf con los datos generados', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        const visor = screen.getByTitle('Vista previa del reporte en PDF');
        expect(visor).toBeInTheDocument();
        expect(visor).toHaveAttribute('src', '/reporte/vista-previa');
        expect(screen.getByText('1 registros', { exact: false })).toBeInTheDocument();
    });

    it('imprimir esta deshabilitado hasta guardar en storage', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        expect(screen.getByRole('button', { name: 'Imprimir' })).toBeDisabled();
        expect(
            screen.getByText('Para imprimir, primero guarde el reporte en el storage.'),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Guardar en storage' }));
        expect(routerPost).toHaveBeenCalledWith(
            '/reporte/guardar',
            expect.objectContaining({ hoy: false }),
        );
    });

    it('con archivo guardado habilita imprimir y descargar', () => {
        const props = {
            ...baseProps(true),
            archivo: { path: 'reportes/reporte-usuario-5-x.pdf', url: '/reporte/descargar?archivo=x' },
        };
        render(React.createElement(ReporteIndex, props as any));

        expect(screen.getByRole('button', { name: 'Imprimir' })).not.toBeDisabled();
        expect(screen.getByText('Descargar PDF')).toBeInTheDocument();
    });

    it('limpiar resetea filtros y vuelve sin parametros', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        expect(screen.getByTitle('Vista previa del reporte en PDF')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(routerGet).toHaveBeenCalledWith('/reporte');
        expect(screen.getByRole('button', { name: 'Generar' })).not.toBeDisabled();
        expect(screen.getByLabelText('Gestión')).toHaveValue('2026');
        expect(screen.getByRole('switch', { name: 'Solo hoy' })).toHaveAttribute('aria-checked', 'false');
    });

    it('muestra el historial con descarga directa', () => {
        const props = {
            ...baseProps(false),
            historial: [
                {
                    id: 1,
                    nombre: 'reporte-usuario-5-20260101-000000.pdf',
                    fecha_desde: '01/03/2026',
                    fecha_hasta: '31/03/2026',
                    hoy: false,
                    gestion: 2026,
                    total_registros: 4,
                    creado_en: '01/04/2026 08:00',
                    url: '/reporte/descargar?archivo=x',
                },
            ],
        };
        render(React.createElement(ReporteIndex, props as any));

        expect(screen.getByText('Mis reportes guardados')).toBeInTheDocument();
        expect(screen.getByText('reporte-usuario-5-20260101-000000.pdf')).toBeInTheDocument();
        expect(screen.getByText('Gestión 2026', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('4 registros', { exact: false })).toBeInTheDocument();
        const enlace = screen.getByRole('link', { name: 'Descargar PDF' });
        expect(enlace).toHaveAttribute('href', '/reporte/descargar?archivo=x');
        const previa = screen.getByRole('link', { name: 'Vista previa' });
        expect(previa).toHaveAttribute('href', '/reporte/descargar?archivo=x');
        expect(previa).toHaveAttribute('target', '_blank');
    });

    it('guardar usa los filtros aplicados aunque se edite el formulario', () => {
        render(React.createElement(ReporteIndex, baseProps(true) as any));

        fireEvent.click(screen.getByRole('switch', { name: 'Solo hoy' }));
        fireEvent.click(screen.getByRole('button', { name: 'Guardar en storage' }));

        expect(routerPost).toHaveBeenCalledWith(
            '/reporte/guardar',
            expect.objectContaining({ fecha_desde: '2026-03-01', fecha_hasta: '2026-03-31', per_page: 15 }),
        );
    });
});
