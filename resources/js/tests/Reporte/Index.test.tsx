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
    numero_completo: 'DLA-7/2026',
    year: 2026,
    fecha: '10/03/2026',
    created_at: '10/03/2026 08:00',
    descripcion: 'Solicitud de prueba',
    numero_diamante: 'DIA-1234',
    estado: 'iniciado',
    urgente: true,
    ultima_respuesta: null,
    area: { id: 1, nombre: 'Dirección Legal', sigla: 'DLA' },
    area_id: 1,
    creador: { id: 9, name: 'Carlos Ruiz' },
    asignado: null,
    derivaciones: [],
    actuaciones: [],
};

function baseProps(generado = false) {
    return {
        auth_usuario: { id: 5, name: 'Ana Pérez', area: 'Dirección Legal', area_id: 1 },
        filtros: { fecha_desde: generado ? '2026-03-01' : null, fecha_hasta: generado ? '2026-03-31' : null, hoy: false },
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
        expect(screen.getByText('Fecha inicial y final')).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Solo hoy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Generar' })).toBeInTheDocument();
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
        expect(screen.getByRole('button', { name: 'Generar' })).toBeDisabled();
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
                    total_registros: 4,
                    creado_en: '01/04/2026 08:00',
                    url: '/reporte/descargar?archivo=x',
                },
            ],
        };
        render(React.createElement(ReporteIndex, props as any));

        expect(screen.getByText('Mis reportes guardados')).toBeInTheDocument();
        expect(screen.getByText('reporte-usuario-5-20260101-000000.pdf')).toBeInTheDocument();
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
