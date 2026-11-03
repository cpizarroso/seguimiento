import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, type Column } from '@/components/ui/Table';
import { estadoReasignacionColor, estadoReasignacionLabel } from './formato';
import type { Reasignacion } from '@/types/reasignaciones';

interface TablaReasignacionesProps {
    reasignaciones: Reasignacion[];
    puedeResolver: boolean;
    procesando: string | null;
    onAprobar: (reasignacion: Reasignacion) => void;
    onRechazar: (reasignacion: Reasignacion) => void;
    onCancelar: (reasignacion: Reasignacion) => void;
}

export function TablaReasignaciones({
    reasignaciones,
    puedeResolver,
    procesando,
    onAprobar,
    onRechazar,
    onCancelar,
}: TablaReasignacionesProps) {
    const columns: Column<Reasignacion>[] = [
        {
            key: 'tramite',
            header: 'Trámite',
            render: (reasignacion) => (
                <div className="min-w-[150px]">
                    <Link
                        href={`/tramites/${reasignacion.tramite?.id}`}
                        className="font-semibold text-excel-green hover:underline dark:text-[#6fd394]"
                    >
                        {reasignacion.tramite?.numero_completo ?? '—'}
                    </Link>
                    <p className="max-w-[220px] truncate text-[11px] text-excel-muted dark:text-gray-400" title={reasignacion.tramite?.descripcion}>
                        {reasignacion.tramite?.descripcion ?? ''}
                    </p>
                </div>
            ),
        },
        {
            key: 'solicitante',
            header: 'Solicitante',
            render: (reasignacion) => (
                <span className="whitespace-nowrap font-medium">
                    {reasignacion.solicitante?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'motivo',
            header: 'Motivo',
            render: (reasignacion) => (
                <p className="max-w-[260px] whitespace-pre-wrap text-[12px]" title={reasignacion.motivo}>
                    {reasignacion.motivo}
                </p>
            ),
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (reasignacion) => (
                <Badge variant={estadoReasignacionColor[reasignacion.estado]}>
                    {estadoReasignacionLabel[reasignacion.estado] ?? reasignacion.estado}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            header: 'Solicitada',
            render: (reasignacion) => (
                <span className="whitespace-nowrap text-[12px] text-excel-muted dark:text-gray-400">
                    {reasignacion.created_at ?? '—'}
                </span>
            ),
        },
        {
            key: 'respuesta',
            header: 'Resolución',
            render: (reasignacion) => (
                <div className="max-w-[220px] text-[12px]">
                    {reasignacion.glosa_respuesta && (
                        <p className="whitespace-pre-wrap text-excel-muted dark:text-gray-400">
                            {reasignacion.glosa_respuesta}
                        </p>
                    )}
                    {reasignacion.resuelto_por && (
                        <p className="text-[11px] text-excel-muted dark:text-gray-500">
                            {reasignacion.resuelto_por.name}
                            {reasignacion.fecha_resolucion ? ` · ${reasignacion.fecha_resolucion}` : ''}
                        </p>
                    )}
                    {!reasignacion.glosa_respuesta && !reasignacion.resuelto_por && (
                        <span className="text-excel-muted dark:text-gray-500">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (reasignacion) => {
                const esPendiente = reasignacion.estado === 'pendiente';
                const aprobando = procesando === `aprobar-${reasignacion.id}`;
                const rechazando = procesando === `rechazar-${reasignacion.id}`;
                const cancelando = procesando === `cancelar-${reasignacion.id}`;

                return (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {esPendiente && puedeResolver && (
                            <>
                                <Button
                                    size="sm"
                                    loading={aprobando}
                                    disabled={rechazando || cancelando}
                                    onClick={() => onAprobar(reasignacion)}
                                >
                                    Aprobar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    loading={rechazando}
                                    disabled={aprobando || cancelando}
                                    onClick={() => onRechazar(reasignacion)}
                                >
                                    Rechazar
                                </Button>
                            </>
                        )}
                        {esPendiente && reasignacion.puede_cancelar && (
                            <Button
                                size="sm"
                                variant="secondary"
                                loading={cancelando}
                                disabled={aprobando || rechazando}
                                onClick={() => onCancelar(reasignacion)}
                            >
                                Cancelar
                            </Button>
                        )}
                        {!esPendiente && !reasignacion.glosa_respuesta && (
                            <span className="text-[11px] text-excel-muted dark:text-gray-500">—</span>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            data={reasignaciones}
            keyExtractor={(reasignacion) => reasignacion.id}
            emptyMessage="No hay solicitudes de reasignación."
        />
    );
}
