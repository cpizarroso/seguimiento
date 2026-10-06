import { router } from '@inertiajs/react';

export interface ReporteFiltros {
    fecha_desde?: string;
    fecha_hasta?: string;
    hoy?: boolean;
    per_page?: number;
}

export const reporteService = {
    index() {
        router.get('/reporte');
    },

    generar(filtros: ReporteFiltros) {
        router.get(
            '/reporte',
            {
                fecha_desde: filtros.fecha_desde || undefined,
                fecha_hasta: filtros.fecha_hasta || undefined,
                hoy: filtros.hoy ? '1' : undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    },

    irPagina(filtros: ReporteFiltros, page: number) {
        router.get(
            '/reporte',
            {
                fecha_desde: filtros.fecha_desde || undefined,
                fecha_hasta: filtros.fecha_hasta || undefined,
                hoy: filtros.hoy ? '1' : undefined,
                page,
            },
            { preserveState: true, preserveScroll: true },
        );
    },

    guardar(filtros: ReporteFiltros) {
        router.post('/reporte/guardar', {
            fecha_desde: filtros.fecha_desde || null,
            fecha_hasta: filtros.fecha_hasta || null,
            hoy: filtros.hoy ?? false,
            per_page: filtros.per_page ?? 15,
        });
    },
};
