import { Head } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import {
    ModalResolverReasignacion,
    type AccionResolucion,
} from '@/components/features/reasignaciones/ModalResolverReasignacion';
import { TablaReasignaciones } from '@/components/features/reasignaciones/TablaReasignaciones';
import { estadoReasignacionLabel } from '@/components/features/reasignaciones/formato';
import { useReasignaciones } from '@/hooks/useReasignaciones';
import type { EstadoReasignacion, Reasignacion, ReasignacionesIndexProps } from '@/types/reasignaciones';

const ESTADOS: EstadoReasignacion[] = ['pendiente', 'aprobada', 'rechazada', 'cancelada'];

interface ResolucionEnCurso {
    reasignacion: Reasignacion;
    accion: AccionResolucion;
}

export default function ReasignacionesIndex({
    reasignaciones,
    puede_resolver,
    filtros,
}: ReasignacionesIndexProps) {
    const { procesando, aprobar, rechazar, cancelar, filtrar } = useReasignaciones();
    const [busqueda, setBusqueda] = useState(filtros.search ?? '');
    const [resolucion, setResolucion] = useState<ResolucionEnCurso | null>(null);

    const meta = reasignaciones.meta;

    const aplicarFiltros = (cambios: { estado?: string; search?: string }) => {
        filtrar({
            estado: cambios.estado ?? filtros.estado ?? '',
            search: cambios.search ?? filtros.search ?? '',
            page: 1,
        });
    };

    const enviarBusqueda = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        aplicarFiltros({ search: busqueda.trim() });
    };

    const confirmarResolucion = (glosa: string) => {
        if (!resolucion) return;

        const { reasignacion, accion } = resolucion;

        if (accion === 'aprobar') {
            aprobar(reasignacion, glosa, () => setResolucion(null));
            return;
        }

        rechazar(reasignacion, glosa, () => setResolucion(null));
    };

    return (
        <div className="space-y-4">
            <Head title="Reasignaciones" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-excel-text dark:text-gray-100">Reasignaciones</h1>
                    <p className="mt-0.5 text-sm text-excel-muted dark:text-gray-400">
                        {puede_resolver
                            ? 'Aprueba o rechaza las solicitudes de trámites de tu equipo.'
                            : 'Solicitudes que enviaste al jefe o administrador.'}
                    </p>
                </div>
                <span className="text-sm text-excel-muted dark:text-gray-400">
                    {meta.total} {meta.total === 1 ? 'solicitud' : 'solicitudes'}
                </span>
            </div>

            <Card>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <form onSubmit={enviarBusqueda} className="flex items-end gap-2">
                        <Input
                            aria-label="Buscar trámite"
                            placeholder="N° de trámite, diamante o descripción"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            leftElement={<Icon name="search" size={14} />}
                            className="w-72"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-9 items-center rounded-md border border-excel-border-strong bg-excel-surface px-3 text-sm font-semibold text-excel-text shadow-sm transition-colors hover:bg-excel-surface-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                        >
                            Buscar
                        </button>
                    </form>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <FilterChip
                            label="Todas"
                            checked={!filtros.estado}
                            onChange={() => aplicarFiltros({ estado: '' })}
                        />
                        {ESTADOS.map((estado) => (
                            <FilterChip
                                key={estado}
                                label={estadoReasignacionLabel[estado]}
                                checked={filtros.estado === estado}
                                onChange={() => aplicarFiltros({ estado })}
                            />
                        ))}
                    </div>
                </div>

                <TablaReasignaciones
                    reasignaciones={reasignaciones.data}
                    puedeResolver={puede_resolver}
                    procesando={procesando}
                    onAprobar={(reasignacion) => setResolucion({ reasignacion, accion: 'aprobar' })}
                    onRechazar={(reasignacion) => setResolucion({ reasignacion, accion: 'rechazar' })}
                    onCancelar={(reasignacion) => cancelar(reasignacion)}
                />

                <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    from={meta.from}
                    to={meta.to}
                    total={meta.total}
                    label="solicitudes"
                    onPageChange={(page) => {
                        filtrar({
                            estado: filtros.estado ?? '',
                            search: filtros.search ?? '',
                            page,
                        });
                    }}
                />
            </Card>

            <ModalResolverReasignacion
                open={resolucion !== null}
                onClose={() => setResolucion(null)}
                reasignacion={resolucion?.reasignacion ?? null}
                accion={resolucion?.accion ?? 'aprobar'}
                onConfirmar={confirmarResolucion}
            />
        </div>
    );
}
