import { useState } from 'react';
import { reporteService, type ReporteFiltros } from '@/services/reporteService';

interface UseReporteInicial {
    fecha_desde: string | null;
    fecha_hasta: string | null;
    hoy: boolean;
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

    const filtrosActuales = (): ReporteFiltros => ({
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        hoy: soloHoy,
    });

    const cambiarRango = (desde: string, hasta: string) => {
        setFechaDesde(desde);
        setFechaHasta(hasta);
        setSoloHoy(false);
    };

    const cambiarHoy = (valor: boolean) => {
        setSoloHoy(valor);
        if (valor) {
            const hoy = hoyISO();
            setFechaDesde(hoy);
            setFechaHasta(hoy);
        }
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
        reporteService.index();
    };

    const rangoValido = fechaDesde !== '' && fechaHasta !== '';

    return {
        fechaDesde,
        fechaHasta,
        soloHoy,
        cambiarRango,
        cambiarHoy,
        generar,
        irPagina,
        guardar,
        limpiar,
        rangoValido,
    };
}
