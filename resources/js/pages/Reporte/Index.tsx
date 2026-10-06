import { useRef } from 'react';
import { useReporte } from '@/hooks/useReporte';
import type { ReporteFiltros as FiltrosParams } from '@/services/reporteService';
import { ReporteFiltros } from '@/components/features/reporte/ReporteFiltros';
import { ReporteHistorial, type ReporteGuardado } from '@/components/features/reporte/ReporteHistorial';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { PaginatedData, Tramite } from '@/types/generated/Tramite';

interface AuthUsuario {
    id: number;
    name: string;
    area: string | null;
    area_id: number | null;
}

interface FiltrosBackend {
    fecha_desde: string | null;
    fecha_hasta: string | null;
    hoy: boolean;
}

interface ArchivoGuardado {
    path: string;
    url: string;
}

interface ReporteIndexProps {
    auth_usuario: AuthUsuario;
    filtros: FiltrosBackend;
    generado: boolean;
    reporte: PaginatedData<Tramite>;
    archivo: ArchivoGuardado | null;
    historial: ReporteGuardado[];
    vista_previa_url: string | null;
}

export default function ReporteIndex({ auth_usuario, filtros, generado, reporte, archivo, historial, vista_previa_url }: ReporteIndexProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const {
        fechaDesde,
        fechaHasta,
        soloHoy,
        cambiarRango,
        cambiarHoy,
        generar,
        guardar,
        limpiar,
        rangoValido,
    } = useReporte({
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        hoy: filtros.hoy,
    });

    const puedeImprimir = archivo !== null;

    const imprimir = () => {
        const ventana = iframeRef.current?.contentWindow;
        if (ventana) {
            ventana.focus();
            ventana.print();
        } else {
            window.print();
        }
    };

    // Filtros aplicados (los que generaron la vista previa). Guardar y
    // paginar los reutilizan para que el PDF coincida con lo mostrado,
    // aunque el formulario se edite después sin clicar Generar.
    const filtrosAplicados: FiltrosParams = {
        fecha_desde: filtros.fecha_desde ?? '',
        fecha_hasta: filtros.fecha_hasta ?? '',
        hoy: filtros.hoy,
        per_page: reporte.meta.per_page,
    };

    return (
        <div className="space-y-6">
            <style>{`@media print {
                .app-sidebar, .app-header { display: none !important; }
                main { padding: 0 !important; overflow: visible !important; }
                .reporte-documento { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }`}</style>

            <div className="flex items-center justify-between print:hidden">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">
                    Reporte
                </h2>
            </div>

            <ReporteFiltros
                usuarioNombre={auth_usuario.name}
                usuarioArea={auth_usuario.area}
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                soloHoy={soloHoy}
                puedeGenerar={rangoValido}
                onRangoChange={cambiarRango}
                onHoyChange={cambiarHoy}
                onGenerar={generar}
                onLimpiar={limpiar}
            />

            {generado && (
                <div className="space-y-4">
                    <Card padding="sm">
                        <div className="mx-auto max-w-[8.5in]">
                            {vista_previa_url ? (
                                <iframe
                                    ref={iframeRef}
                                    src={vista_previa_url}
                                    title="Vista previa del reporte en PDF"
                                    className="h-[75vh] min-h-[560px] w-full rounded-lg border border-gray-200 bg-white dark:border-gray-700"
                                />
                            ) : (
                                <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Sin datos para mostrar en el rango seleccionado.
                                </p>
                            )}
                            <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                {reporte.meta.total} registros
                            </p>
                        </div>
                    </Card>

                    <Card padding="sm" className="print:hidden">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => guardar(filtrosAplicados)} variant="primary">
                                    Guardar en storage
                                </Button>
                                {puedeImprimir && archivo ? (
                                    <a
                                        href={archivo.url}
                                        className="inline-flex items-center justify-center rounded-lg font-medium transition-colors px-4 py-2 text-sm bg-patuju-cream dark:bg-gray-700 text-patuju-green dark:text-patuju-green border border-patuju-green/30 hover:bg-patuju-cream/80"
                                    >
                                        Descargar PDF
                                    </a>
                                ) : null}
                                <Button
                                    variant="secondary"
                                    onClick={imprimir}
                                    disabled={!puedeImprimir}
                                    title={puedeImprimir ? 'Imprimir documento' : 'Primero guarde el reporte en el storage'}
                                >
                                    Imprimir
                                </Button>
                            </div>
                            {!puedeImprimir && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Para imprimir, primero guarde el reporte en el storage.
                                </p>
                            )}
                            {puedeImprimir && archivo && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Guardado: {archivo.path}
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <ReporteHistorial historial={historial ?? []} />
        </div>
    );
}
