import { useState } from 'react';
import { reporteService, type ReporteFiltros } from '@/services/reporteService';

interface UseReporteInicial {
    fecha_desde: string | null;
    fecha_hasta: string | null;
    hoy: boolean;
    gestion: number | null;
    gestion_actual: number;
    numero_tramite: string | null;
    area_id: number | null;
}

function normalizar(valor: string | null | undefined): string {
    return valor ?? '';
}

function hoyISO(): string {
    const f = new Date();
    const y = f.getFullYear();
    const m = String(f.getMonth() + 1).padStart(2, '0');
    const d = String(f.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function useReporte(inicial: UseReporteInicial) {
    const [fechaDesde, setFechaDesde] = useState<string>(normalizar(inicial.fecha_desde));
    const [fechaHasta, setFechaHasta] = useState<string>(normalizar(inicial.fecha_hasta));
    const [soloHoy, setSoloHoy] = useState<boolean>(inicial.hoy);
    const [gestion, setGestion] = useState<number | null>(inicial.gestion);
    const [numeroTramite, setNumeroTramite] = useState<string>(normalizar(inicial.numero_tramite));
    const [areaId, setAreaId] = useState<number | null>(inicial.area_id);

    const filtrosActuales = (): ReporteFiltros => ({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        hoy: soloHoy,
        gestion,
        numero_tramite: numeroTramite,
        area_id: areaId,
    });

    const cambiarRango = (desde: string, hasta: string) => {
        setFechaDesde(desde);
        setFechaHasta(hasta);
        setSoloHoy(false);
    };

    const cambiarGestion = (valor: number | null) => {
        setGestion(valor);
        setSoloHoy(false);

        if (valor !== null) {
            setFechaDesde('');
            setFechaHasta('');
        }
    };

    const cambiarHoy = (valor: boolean) => {
        setSoloHoy(valor);
        if (valor) {
            const hoy = hoyISO();
            setFechaDesde(hoy);
            setFechaHasta(hoy);
            setGestion(inicial.gestion_actual);
        }
    };

    const cambiarNumeroTramite = (valor: string) => {
        setNumeroTramite(valor);
    };

    const cambiarArea = (valor: number | null) => {
        setAreaId(valor);
    };

    const generar = () => {
        reporteService.generar(filtrosActuales());
    };

    const irPagina = (aplicados: ReporteFiltros, page: number) => {
        reporteService.irPagina(aplicados, page);
    };

    const guardar = (aplicados: ReporteFiltros) => {
        reporteService.guardar(aplicados);
    };

    const limpiar = () => {
        setFechaDesde('');
        setFechaHasta('');
        setSoloHoy(false);
        setGestion(inicial.gestion_actual);
        setNumeroTramite('');
        setAreaId(inicial.area_id);
        reporteService.index();
    };

    const rangoValido = fechaDesde !== '' && fechaHasta !== '';

    return {
        fechaDesde,
        fechaHasta,
        soloHoy,
        gestion,
        numeroTramite,
        areaId,
        cambiarRango,
        cambiarGestion,
        cambiarHoy,
        cambiarNumeroTramite,
        cambiarArea,
        generar,
        irPagina,
        guardar,
        limpiar,
        rangoValido,
    };
}
