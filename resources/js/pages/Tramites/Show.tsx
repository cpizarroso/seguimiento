import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { useState } from 'react';
import type { Tramite, Derivacion } from '@/types/generated/Tramite';
import type { User } from '@/types/generated/User';

interface ShowProps {
    tramite: Tramite;
    usuarios: { data: User[] };
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

export default function TramitesShow({ tramite, usuarios }: ShowProps) {
    const { auth } = usePage().props;
    const usuarioId = auth?.user?.id;
    const params = new URLSearchParams(window.location.search);
    const vistaAnterior = params.get('vista') ?? 'bandeja';
    const busquedaAnterior = params.get('search') ?? '';
    const [derivarOpen, setDerivarOpen] = useState(false);
    const [recepcionarOpen, setRecepcionarOpen] = useState<number | null>(null);
    const [derivarSuccess, setDerivarSuccess] = useState<{ destino: string; glosa?: string } | null>(null);
    const [observarOpen, setObservarOpen] = useState(false);
    const [finalizarOpen, setFinalizarOpen] = useState(false);

    const derivarForm = useForm({ derivado_a: '', glosa_derivacion: '' });
    const recepcionarForm = useForm({ glosa_recepcion: '' });
    const observarForm = useForm({ glosa_observacion: '', derivado_a: '', estado: 'observado' });
    const finalizarForm = useForm({ glosa_finalizacion: '', estado: 'finalizado' });

    const otrosUsuarios = usuarios?.data?.filter((u) => u.id !== usuarioId) ?? [];

    const ultimaDerivacion = tramite.derivaciones?.at(-1);
    const asignadoAMi = tramite.asignado?.id === usuarioId;
    const recepcionadoPorMi = ultimaDerivacion?.estado === 'recepcionado' && ultimaDerivacion.derivado_a?.id === usuarioId;

    const puedeDerivar = tramite.estado !== 'finalizado' && asignadoAMi && (tramite.estado === 'iniciado' || recepcionadoPorMi);
    const puedeObservar = tramite.estado === 'proceso' && asignadoAMi && recepcionadoPorMi;
    const puedeFinalizar = ['proceso', 'observado'].includes(tramite.estado) && asignadoAMi && recepcionadoPorMi;
    const puedeRecepcionar = ultimaDerivacion && ultimaDerivacion.estado === 'derivado' && ultimaDerivacion.derivado_a?.id === usuarioId && tramite.estado !== 'finalizado';
    const derivacionColumns: Column<Derivacion>[] = [
        {
            key: 'numero_derivacion',
            header: 'Derivacion',
            render: (d) => <span className="font-medium">#{d.numero_derivacion}</span>,
        },
        {
            key: 'derivado_de',
            header: 'De:',
            render: (d) => d.derivado_de?.name ?? '—',
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
            render: (d) => d.derivado_a?.name ?? '—',
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
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green flex items-center gap-3">
                    Trámite N° {tramite.numero_formateado}/{tramite.year}
                    <Badge variant={estadoColors[tramite.estado] ?? 'default'} className="text-base px-4 py-1">
                        {estadoLabels[tramite.estado] ?? tramite.estado}
                    </Badge>
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
                    <Link href={`/tramites?vista=${vistaAnterior}${busquedaAnterior ? `&search=${busquedaAnterior}` : ''}`}>
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Detalles del Trámite</h3>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">N° Trámite</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.numero_formateado}/{tramite.year}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.fecha}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Estado</dt>
                        <dd>
                            <Badge variant={estadoColors[tramite.estado] ?? 'default'} className="text-base px-5 py-2 font-bold">
                                {estadoLabels[tramite.estado] ?? tramite.estado}
                            </Badge>
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
                    {tramite.asignado && (
                        <div className="flex justify-between sm:flex-col">
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Derivado a</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{tramite.asignado.name}</dd>
                        </div>
                    )}
                </dl>
                {tramite.descripcion && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <dt className="text-sm text-gray-500 dark:text-gray-400 mb-1">Descripción</dt>
                        <dd className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{tramite.descripcion}</dd>
                    </div>
                )}
            </Card>

            {tramite.derivaciones && tramite.derivaciones.length > 0 ? (
                <Table
                    columns={derivacionColumns}
                    data={tramite.derivaciones}
                    keyExtractor={(d) => d.id}
                />
            ) : (
                <Card>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        Este trámite aún no tiene derivaciones registradas.
                    </p>
                </Card>
            )}

            <Modal open={derivarOpen} onClose={() => setDerivarOpen(false)} title="Derivar Trámite">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        derivarForm.post(`/tramites/${tramite.id}/derivar`, {
                            onSuccess: () => {
                                setDerivarOpen(false);
                                const destino = usuarios.data.find((u) => String(u.id) === derivarForm.data.derivado_a);
                                setDerivarSuccess({
                                    destino: destino?.name ?? '—',
                                    glosa: derivarForm.data.glosa_derivacion || undefined,
                                });
                            },
                        });
                    }}
                    className="space-y-4"
                >
                    <Select
                        label="Derivar a"
                        placeholder="Seleccione funcionario"
                        options={otrosUsuarios.map((u) => ({ value: String(u.id), label: u.name }))}
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

            <AlertDialog
                open={derivarSuccess !== null}
                onClose={() => setDerivarSuccess(null)}
                icon="✓"
                title="Trámite Derivado"
                description={`Derivado exitosamente a ${derivarSuccess?.destino ?? '—'}`}
            >
                {derivarSuccess?.glosa && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Glosa: {derivarSuccess.glosa}
                    </p>
                )}
            </AlertDialog>

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
