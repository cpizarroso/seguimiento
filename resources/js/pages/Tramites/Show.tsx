import { Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { usePermissions } from '@/hooks/usePermissions';
import { TramiteTimeline } from '@/components/features/tramites/TramiteTimeline';
import { useEffect, useState } from 'react';
import type { Tramite, Actuacion, Area } from '@/types/generated/Tramite';
import type { User } from '@/types/generated/User';

interface ShowProps {
    tramite: Tramite;
    usuarios: { data: User[] };
    areas: { data: Area[] };
    funcionarios: { data: FuncionarioOption[] };
}

interface FuncionarioOption {
    id: number;
    nombre: string;
    apellidos: string;
    area_id: number | null;
}

const estadoColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    iniciado: 'info',
    proceso: 'warning',
    observado: 'default',
    finalizado: 'success',
};

const estadoLabels: Record<string, string> = {
    iniciado: 'Iniciado',
    proceso: 'Proceso',
    observado: 'Observado',
    finalizado: 'Finalizado',
};

export default function TramitesShow({ tramite, usuarios, areas, funcionarios }: ShowProps) {
    const { auth } = usePage().props;
    const usuario = auth?.user as { id: number; role: string; permisos: string[] } | null;
    const usuarioId = usuario?.id;
    const { can } = usePermissions();
    const puedeGestionar = can('tramites', 'edicion');
    const params = new URLSearchParams(window.location.search);
    const busquedaAnterior = params.get('search') ?? '';
    const urgenteAnterior = params.get('urgente') === '1';
    const volverQuery = [
        busquedaAnterior ? `search=${encodeURIComponent(busquedaAnterior)}` : '',
        urgenteAnterior ? 'urgente=1' : '',
    ].filter(Boolean).join('&');
    const volverHref = volverQuery ? `/tramites?${volverQuery}` : '/tramites';
    const [recepcionarOpen, setRecepcionarOpen] = useState<number | null>(null);
    const [observarOpen, setObservarOpen] = useState(false);
    const [finalizarOpen, setFinalizarOpen] = useState(false);
    const [actuacionOpen, setActuacionOpen] = useState(false);

    const actuacionForm = useForm({ glosa: '' });
    const recepcionarForm = useForm({ glosa_recepcion: '' });
    const observarForm = useForm({ glosa_observacion: '', derivado_a: '', estado: 'observado' });
    const finalizarForm = useForm({ glosa_finalizacion: '', estado: 'finalizado' });

    const otrosUsuarios = usuarios?.data?.filter((u) => u.id !== usuarioId) ?? [];

    const ultimaDerivacion = tramite.derivaciones?.at(-1);
    const asignadoAMi = tramite.asignado?.id === usuarioId;
    const recepcionadoPorMi = ultimaDerivacion?.estado === 'recepcionado' && ultimaDerivacion.derivado_a?.id === usuarioId;

    const puedeObservar = puedeGestionar && tramite.estado === 'proceso' && asignadoAMi && recepcionadoPorMi;
    const puedeFinalizar = puedeGestionar && ['proceso', 'observado'].includes(tramite.estado) && asignadoAMi && recepcionadoPorMi;
    const puedeRecepcionar = puedeGestionar && ultimaDerivacion && ultimaDerivacion.estado === 'derivado' && ultimaDerivacion.derivado_a?.id === usuarioId && tramite.estado !== 'finalizado';

    const derivaciones = tramite.derivaciones ?? [];
    const [derivacionSeleccionadaId, setDerivacionSeleccionadaId] = useState<number | null>(
        derivaciones.at(-1)?.id ?? null,
    );

    useEffect(() => {
        setDerivacionSeleccionadaId(derivaciones.at(-1)?.id ?? null);
    }, [tramite.id]);

    const derivacionSeleccionada = derivaciones.find((d) => d.id === derivacionSeleccionadaId)
        ?? derivaciones.at(-1);
    const actuacionesVisibles = derivacionSeleccionada?.actuaciones ?? [];
    const puedeActuar = puedeGestionar
        && tramite.estado !== 'finalizado'
        && !!derivacionSeleccionada
        && derivacionSeleccionada.estado === 'recepcionado'
        && derivacionSeleccionada.derivado_a?.id === usuarioId;
    const actuacionColumns: Column<Actuacion>[] = [
        {
            key: 'fecha_actuacion',
            header: 'Fecha',
            render: (a) => <span className="whitespace-nowrap font-medium">{a.fecha_actuacion}</span>,
        },
        {
            key: 'area',
            header: 'Área',
            render: (a) => a.area ? `${a.area.nombre} (${a.area.sigla})` : '—',
        },
        {
            key: 'funcionario',
            header: 'Funcionario',
            render: (a) => a.funcionario ? `${a.funcionario.nombre} ${a.funcionario.apellidos}` : '—',
        },
        {
            key: 'glosa',
            header: 'Glosa',
            render: (a) => <span className="whitespace-pre-wrap">{a.glosa}</span>,
        },
        {
            key: 'dias_transcurridos',
            header: 'Días',
            cellClassName: 'text-center',
            render: (a) => (
                <span className="inline-flex items-center justify-center min-w-8 h-8 rounded-full px-2 text-sm font-semibold bg-patuju-green/10 text-patuju-green">
                    {a.dias_transcurridos}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green flex items-center gap-3">
                    Trámite N° {tramite.numero_completo}
                    <Badge variant={estadoColors[tramite.estado] ?? 'default'} className="text-base px-4 py-1">
                        {estadoLabels[tramite.estado] ?? tramite.estado}
                    </Badge>
                    {tramite.urgente && (
                        <Badge variant="danger" className="text-base px-4 py-1">Urgente</Badge>
                    )}
                    {typeof tramite.dias_transcurridos === 'number' && (
                        <Badge variant="warning" className="text-base px-4 py-1">
                            {tramite.dias_transcurridos} {tramite.dias_transcurridos === 1 ? 'día' : 'días'}
                        </Badge>
                    )}
                </h2>
                <div className="flex gap-2">
                    {puedeGestionar && (
                        <Link href={`/tramites/${tramite.id}/edit`}>
                            <Button>Editar</Button>
                        </Link>
                    )}
                    {puedeRecepcionar && (
                        <Button onClick={() => setRecepcionarOpen(ultimaDerivacion!.id)} variant="secondary">
                            Recepcionar
                        </Button>
                    )}
                    {puedeObservar && (
                        <Button variant="secondary" onClick={() => setObservarOpen(true)}>
                            Observar
                        </Button>
                    )}
                    {puedeFinalizar && (
                        <Button variant="danger" onClick={() => setFinalizarOpen(true)}>
                            Finalizar
                        </Button>
                    )}
                    <Link href={volverHref}>
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Detalles del Trámite</h3>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">N° Trámite</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.numero_completo}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.fecha}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Estado</dt>
                        <dd className="flex flex-wrap items-center gap-2">
                            <Badge variant={estadoColors[tramite.estado] ?? 'default'} className="text-base px-5 py-2 font-bold">
                                {estadoLabels[tramite.estado] ?? tramite.estado}
                            </Badge>
                            {tramite.urgente && (
                                <Badge variant="danger" className="text-base px-5 py-2 font-bold">Urgente</Badge>
                            )}
                        </dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Área</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.area?.nombre ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">N° Diamante</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.numero_diamante ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Creado por</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.creador?.name ?? '—'}</dd>
                    </div>
                </dl>
                {tramite.descripcion && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{tramite.descripcion}</dd>
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Historial de derivaciones</h3>
                <TramiteTimeline derivaciones={tramite.derivaciones ?? []} />
            </Card>

            <Card>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green">Actuaciones</h3>
                    <div className="flex flex-wrap items-center gap-3">
                        {derivaciones.length > 0 && (
                            <Select
                                aria-label="Derivación"
                                className="w-64"
                                value={derivacionSeleccionada ? String(derivacionSeleccionada.id) : ''}
                                onChange={(e) => setDerivacionSeleccionadaId(e.target.value ? Number(e.target.value) : null)}
                                options={derivaciones.map((d) => ({
                                    value: String(d.id),
                                    label: `N° ${d.numero_derivacion} · ${d.estado} · → ${d.derivado_a?.name ?? '—'}`,
                                }))}
                            />
                        )}
                        {puedeActuar && (
                            <Button onClick={() => setActuacionOpen(true)}>Registrar actuación</Button>
                        )}
                    </div>
                </div>
                {actuacionesVisibles.length > 0 ? (
                    <Table
                        columns={actuacionColumns}
                        data={actuacionesVisibles}
                        keyExtractor={(a) => a.id}
                    />
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {derivaciones.length === 0
                            ? 'Este trámite aún no tiene derivaciones registradas.'
                            : 'La derivación seleccionada aún no tiene actuaciones registradas.'}
                    </p>
                )}
                {!puedeActuar && derivaciones.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        Solo puedes registrar actuaciones en derivaciones recepcionadas por ti.
                    </p>
                )}
            </Card>

            <Modal open={actuacionOpen} onClose={() => setActuacionOpen(false)} title="Registrar actuación">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!derivacionSeleccionada) return;
                        actuacionForm.post(`/derivaciones/${derivacionSeleccionada.id}/actuaciones`, {
                            onSuccess: () => {
                                setActuacionOpen(false);
                                actuacionForm.reset();
                            },
                        });
                    }}
                    className="space-y-4"
                >
                    <div className="rounded-lg bg-patuju-cream/60 dark:bg-gray-700/50 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                        Área: <span className="font-medium">{tramite.area?.nombre ?? '—'}</span>
                        {' · '}Responsable: <span className="font-medium">{derivacionSeleccionada?.derivado_a?.name ?? '—'}</span>
                        <span className="block mt-0.5 text-gray-500 dark:text-gray-400">Se asignan automáticamente desde el trámite.</span>
                    </div>
                    <div>
                        <label htmlFor="glosa" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Glosa
                        </label>
                        <textarea
                            id="glosa"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={actuacionForm.data.glosa}
                            onChange={(e) => actuacionForm.setData('glosa', e.target.value)}
                        />
                        {actuacionForm.errors.glosa && <p className="text-xs text-patuju-red">{actuacionForm.errors.glosa}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={actuacionForm.processing}>Guardar</Button>
                        <Button type="button" variant="secondary" onClick={() => setActuacionOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                open={recepcionarOpen !== null}
                onClose={() => setRecepcionarOpen(null)}
                title="Recepcionar Trámite"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (recepcionarOpen === null) return;
                        recepcionarForm.put(`/derivaciones/${recepcionarOpen}/recepcionar`, {
                            onSuccess: () => setRecepcionarOpen(null),
                        });
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label htmlFor="glosa_recepcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Glosa de recepción
                        </label>
                        <textarea
                            id="glosa_recepcion"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={recepcionarForm.data.glosa_recepcion}
                            onChange={(e) => recepcionarForm.setData('glosa_recepcion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={recepcionarForm.processing}>Recepcionar</Button>
                        <Button type="button" variant="secondary" onClick={() => setRecepcionarOpen(null)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={observarOpen} onClose={() => setObservarOpen(false)} title="Observar Trámite">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        observarForm.put(`/tramites/${tramite.id}/estado`, {
                            onSuccess: () => {
                                setObservarOpen(false);
                                observarForm.reset();
                            },
                        });
                    }}
                    className="space-y-4"
                >
                    <Select
                        label="Derivar a"
                        placeholder="Seleccione funcionario"
                        options={otrosUsuarios.map((u) => ({ value: String(u.id), label: u.name }))}
                        value={observarForm.data.derivado_a}
                        onChange={(e) => observarForm.setData('derivado_a', e.target.value)}
                        error={observarForm.errors.derivado_a}
                    />
                    <div>
                        <label htmlFor="glosa_observacion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Glosa de observación
                        </label>
                        <textarea
                            id="glosa_observacion"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={observarForm.data.glosa_observacion}
                            onChange={(e) => observarForm.setData('glosa_observacion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={observarForm.processing} variant="secondary">Observar</Button>
                        <Button type="button" variant="secondary" onClick={() => setObservarOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={finalizarOpen} onClose={() => setFinalizarOpen(false)} title="Finalizar Trámite">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        finalizarForm.put(`/tramites/${tramite.id}/estado`, {
                            onSuccess: () => {
                                setFinalizarOpen(false);
                                finalizarForm.reset();
                            },
                        });
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label htmlFor="glosa_finalizacion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Glosa de finalización
                        </label>
                        <textarea
                            id="glosa_finalizacion"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={finalizarForm.data.glosa_finalizacion}
                            onChange={(e) => finalizarForm.setData('glosa_finalizacion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={finalizarForm.processing} variant="danger">Finalizar</Button>
                        <Button type="button" variant="secondary" onClick={() => setFinalizarOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
