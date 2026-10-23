import { router } from '@inertiajs/react';

// El backend interpreta 0 como "todas las gestiones".
const GESTION_TODAS = 0;

export interface ReporteFiltros {
    fecha_desde?: string;
    fecha_hasta?: string;
    hoy?: boolean;
    gestion?: number | null;
    numero_tramite?: string;
    area_id?: number | null;
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
                gestion: filtros.gestion ?? GESTION_TODAS,
                numero_tramite: filtros.numero_tramite?.trim() || undefined,
                area_id: filtros.area_id ?? undefined,
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
                gestion: filtros.gestion ?? GESTION_TODAS,
                numero_tramite: filtros.numero_tramite?.trim() || undefined,
                area_id: filtros.area_id ?? undefined,
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
            gestion: filtros.gestion ?? GESTION_TODAS,
            numero_tramite: filtros.numero_tramite?.trim() || null,
            area_id: filtros.area_id ?? null,
            per_page: filtros.per_page ?? 15,
        });
    },
};
