import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { useState } from 'react';
import type { Tramite, Funcionario, Derivacion } from '@/types/generated/Tramite';

interface ShowProps {
    tramite: Tramite;
    funcionarios: { data: Funcionario[] };
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

const derivacionEstadoColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    derivado: 'warning',
    recepcionado: 'success',
    rechazado: 'danger',
    historico: 'default',
};

const derivacionEstadoLabels: Record<string, string> = {
    derivado: 'Derivado',
    recepcionado: 'Recepcionado',
    rechazado: 'Rechazado',
    historico: 'Histórico',
};

export default function TramitesShow({ tramite, funcionarios }: ShowProps) {
    const { auth } = usePage().props;
    const funcionarioId = auth?.user?.funcionario_id;
    const [derivarOpen, setDerivarOpen] = useState(false);
    const [recepcionarOpen, setRecepcionarOpen] = useState<number | null>(null);
    const [rechazarOpen, setRechazarOpen] = useState<number | null>(null);

    const derivarForm = useForm({ derivado_a: '', glosa_derivacion: '' });
    const recepcionarForm = useForm({ glosa_recepcion: '' });
    const rechazarForm = useForm({ glosa_rechazo: '' });

    const puedeDerivar = ['iniciado', 'proceso', 'observado'].includes(tramite.estado) && tramite.asignado?.id === funcionarioId;
    const puedeObservar = tramite.estado === 'proceso' && tramite.asignado?.id === funcionarioId;
    const puedeFinalizar = ['proceso', 'observado'].includes(tramite.estado) && tramite.asignado?.id === funcionarioId;
    const ultimaDerivacion = tramite.derivaciones?.at(-1);
    const puedeRecepcionar = ultimaDerivacion && ultimaDerivacion.estado === 'derivado' && ultimaDerivacion.derivado_a?.id === funcionarioId && tramite.estado !== 'finalizado';
    const puedeRechazar = ultimaDerivacion && ultimaDerivacion.estado === 'derivado' && ultimaDerivacion.derivado_a?.id === funcionarioId && tramite.estado !== 'finalizado';

    const derivacionColumns: Column<Derivacion>[] = [
        {
            key: 'numero_derivacion',
            header: 'Derivacion',
            render: (d) => <span className="font-medium">#{d.numero_derivacion}</span>,
        },
        {
            key: 'derivado_de',
            header: 'De:',
            render: (d) => d.derivado_de?.nombre ?? '—',
        },
        {
            key: 'fecha_derivacion',
            header: 'Derivado:',
            render: (d) => d.fecha_derivacion,
        },
        {
            key: 'dias_en_derivacion',
            header: 'Dias:',
            render: (d) => `${d.dias_en_derivacion} días`,
        },
        {
            key: 'glosa_derivacion',
            header: 'Glosa de Derivacion:',
            render: (d) => d.glosa_derivacion ?? '—',
        },
        {
            key: 'glosa_recepcion',
            header: 'Glosa Recep./Rech.:',
            render: (d) => d.glosa_recepcion ?? '—',
        },
        {
            key: 'derivado_a',
            header: 'A:',
            render: (d) => d.derivado_a?.nombre ?? '—',
        },
        {
            key: 'fecha_recepcion',
            header: 'Recepcionado:',
            render: (d) => d.fecha_recepcion
                ? d.fecha_recepcion
                : (d.estado === 'rechazado' ? 'Rechazado' : '—'),
        },
        {
            key: 'estado',
            header: 'ESTADO',
            render: (d) => (
                <Badge variant={derivacionEstadoColors[d.estado] ?? 'default'}>
                    {derivacionEstadoLabels[d.estado] ?? d.estado}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">
                    Trámite N° {tramite.numero_formateado}/{tramite.year}
                </h2>
                <div className="flex gap-2">
                    {puedeDerivar && (
                        <Button onClick={() => setDerivarOpen(true)}>Derivar</Button>
                    )}
                    {puedeRecepcionar && (
                        <Button onClick={() => setRecepcionarOpen(ultimaDerivacion!.id)} variant="secondary">
                            Recepcionar
                        </Button>
                    )}
                    {puedeRechazar && (
                        <Button onClick={() => setRechazarOpen(ultimaDerivacion!.id)} variant="danger">
                            Rechazar
                        </Button>
                    )}
                    {puedeObservar && (
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (confirm('¿Marcar el trámite como Observado?')) {
                                    router.put(`/tramites/${tramite.id}/estado`, { estado: 'observado' });
                                }
                            }}
                        >
                            Observar
                        </Button>
                    )}
                    {puedeFinalizar && (
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (confirm('¿Marcar el trámite como Finalizado?')) {
                                    router.put(`/tramites/${tramite.id}/estado`, { estado: 'finalizado' });
                                }
                            }}
                        >
                            Finalizar
                        </Button>
                    )}
                    <Link href="/tramites">
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Detalles del Trámite</h3>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">N° Trámite</dt>
                        <dd className="text-sm font-medium">{tramite.numero_formateado}/{tramite.year}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha</dt>
                        <dd className="text-sm font-medium">{tramite.fecha}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Estado</dt>
                        <dd>
                            <Badge variant={estadoColors[tramite.estado] ?? 'default'}>
                                {estadoLabels[tramite.estado] ?? tramite.estado}
                            </Badge>
                        </dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Puesto</dt>
                        <dd className="text-sm font-medium">{tramite.puesto?.nombre ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">N° Diamante</dt>
                        <dd className="text-sm font-medium">{tramite.numero_diamante ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Creado por</dt>
                        <dd className="text-sm font-medium">{tramite.creador?.nombre ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Derivado a</dt>
                        <dd className="text-sm font-medium">{tramite.asignado?.nombre ?? '—'}</dd>
                    </div>
                </dl>
                {tramite.glosa && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Glosa</dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tramite.glosa}</dd>
                    </div>
                )}
                {tramite.descripcion && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</dt>
                        <dd className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{tramite.descripcion}</dd>
                    </div>
                )}
            </Card>

            {tramite.derivaciones && tramite.derivaciones.length > 0 && (
                <Table
                    columns={derivacionColumns}
                    data={tramite.derivaciones}
                    keyExtractor={(d) => d.id}
                    emptyMessage="No hay derivaciones registradas."
                />
            )}

            <Modal open={derivarOpen} onClose={() => setDerivarOpen(false)} title="Derivar Trámite">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        derivarForm.post(`/tramites/${tramite.id}/derivar`, {
                            onSuccess: () => setDerivarOpen(false),
                        });
                    }}
                    className="space-y-4"
                >
                    <Select
                        label="Derivar a"
                        placeholder="Seleccione funcionario"
                        options={funcionarios.data.map((f) => ({ value: String(f.id), label: f.nombre }))}
                        value={derivarForm.data.derivado_a}
                        onChange={(e) => derivarForm.setData('derivado_a', e.target.value)}
                        error={derivarForm.errors.derivado_a}
                    />
                    <div>
                        <label htmlFor="glosa_derivacion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Glosa de derivación
                        </label>
                        <textarea
                            id="glosa_derivacion"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={derivarForm.data.glosa_derivacion}
                            onChange={(e) => derivarForm.setData('glosa_derivacion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={derivarForm.processing}>Derivar</Button>
                        <Button type="button" variant="secondary" onClick={() => setDerivarOpen(false)}>Cancelar</Button>
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

            <Modal
                open={rechazarOpen !== null}
                onClose={() => setRechazarOpen(null)}
                title="Rechazar Trámite"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (rechazarOpen === null) return;
                        rechazarForm.put(`/derivaciones/${rechazarOpen}/rechazar`, {
                            onSuccess: () => setRechazarOpen(null),
                        });
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label htmlFor="glosa_rechazo" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                            Motivo del rechazo
                        </label>
                        <textarea
                            id="glosa_rechazo"
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            value={rechazarForm.data.glosa_rechazo}
                            onChange={(e) => rechazarForm.setData('glosa_rechazo', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={rechazarForm.processing} variant="danger">Rechazar</Button>
                        <Button type="button" variant="secondary" onClick={() => setRechazarOpen(null)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
