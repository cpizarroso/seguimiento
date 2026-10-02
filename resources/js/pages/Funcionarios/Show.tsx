import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table, type Column } from '@/components/ui/Table';
import { CambiarPuestoModal, type AreaHistorialOption, type PuestoHistorialOption } from '@/components/features/funcionarios/CambiarPuestoModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { Funcionario, FuncionarioPuesto } from '@/types/generated/Funcionario';

interface ShowProps {
    funcionario: Funcionario;
    historial_puestos: { data: FuncionarioPuesto[] };
    areas?: { data: AreaHistorialOption[] };
    puestos?: { data: PuestoHistorialOption[] };
}

export default function FuncionariosShow({ funcionario, historial_puestos, areas, puestos }: ShowProps) {
    const historial = historial_puestos?.data ?? [];
    const listaAreas = areas?.data ?? [];
    const listaPuestos = puestos?.data ?? [];

    const [showPuestoModal, setShowPuestoModal] = useState(false);
    const { can } = usePermissions();

    const puestoForm = useForm({ area_id: '', puesto_id: '' });

    const puestoVigente = historial.find((h) => h.es_vigente);

    const abrirModalPuesto = () => {
        puestoForm.setData({
            area_id: String(
                listaPuestos.find((p) => p.id === funcionario.puesto_id)?.area_id ?? funcionario.area_id ?? '',
            ),
            puesto_id: String(funcionario.puesto_id ?? ''),
        });
        puestoForm.clearErrors();
        setShowPuestoModal(true);
    };

    const columnasHistorial: Column<FuncionarioPuesto>[] = [
        {
            key: 'puesto',
            header: 'Puesto',
            render: (h) => (
                <span className="font-medium text-gray-900 dark:text-gray-100">
                    {h.puesto ? `${h.puesto.nombre} (${h.puesto.sigla})` : '—'}
                </span>
            ),
        },
        {
            key: 'area',
            header: 'Área',
            render: (h) => h.area?.nombre ?? '—',
        },
        {
            key: 'fecha_inicio',
            header: 'Desde',
            render: (h) => h.fecha_inicio ?? '—',
        },
        {
            key: 'fecha_fin',
            header: 'Hasta',
            render: (h) => h.fecha_fin ?? 'Actualidad',
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (h) =>
                h.es_vigente ? <Badge variant="success">Vigente</Badge> : <Badge variant="info">Histórico</Badge>,
        },
        {
            key: 'registro',
            header: 'Registrado por',
            render: (h) => h.creado_por?.name ?? '—',
        },
    ];

    const estadoBadge = (estado: string) => {
        const variants: Record<string, 'success' | 'warning' | 'danger'> = {
            activo: 'success',
            inactivo: 'warning',
            baja: 'danger',
        };
        return <Badge variant={variants[estado] ?? 'info'}>{estado}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">
                    {funcionario.nombre} {funcionario.apellidos}
                </h2>
                <div className="flex gap-3">
                    {can('funcionarios', 'edicion') && (
                        <Button variant="secondary" onClick={abrirModalPuesto}>Cambiar Puesto</Button>
                    )}
                    <Link href={`/funcionarios/${funcionario.id}/edit`}>
                        <Button variant="secondary">Editar</Button>
                    </Link>
                    <Link href="/funcionarios">
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Datos Personales</h3>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.nombre} {funcionario.apellidos}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.email ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">CI</dt>
<dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.cedula_identidad ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Teléfono</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.nro_telefono ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Dirección</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.direccion ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Fecha de Ingreso</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.fecha_ingreso ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Tipo</dt>
                            <dd className="font-medium capitalize text-gray-900 dark:text-gray-100">{funcionario.tipo_funcionario}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Nivel</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.nivel ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Estado</dt>
                            <dd>{estadoBadge(funcionario.estado)}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Área</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.area?.nombre ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Puesto</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                {funcionario.puesto ? `${funcionario.puesto.nombre} (${funcionario.puesto.sigla})` : '—'}
                                {puestoVigente?.fecha_inicio && (
                                    <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                                        Vigente desde {puestoVigente.fecha_inicio}
                                    </span>
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Usuario</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                {funcionario.usuario ? (
                                    <Link href={`/users/${funcionario.usuario.id}`} className="text-patuju-green hover:underline">
                                        {funcionario.usuario.name} ({funcionario.usuario.email})
                                    </Link>
                                ) : (
                                    'Sin usuario asignado'
                                )}
                            </dd>
                        </div>
                    </dl>
                </Card>

                <Card>
                    <h3 className="mb-4 text-lg font-semibold text-patuju-green dark:text-patuju-green">Información de creación</h3>
                    <dl className="space-y-3">
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Creado por</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">
                                {funcionario.creado_por ? (
                                    <Link href={`/users/${funcionario.creado_por.id}`} className="text-patuju-green hover:underline">
                                        {funcionario.creado_por.name}
                                    </Link>
                                ) : (
                                    '—'
                                )}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Registrado</dt>
                            <dd className="font-medium text-gray-900 dark:text-gray-100">{funcionario.created_at ?? '—'}</dd>
                        </div>
                    </dl>
                </Card>
            </div>

            <Card>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green">Historial de Puestos</h3>
                    {can('funcionarios', 'edicion') && (
                        <Button variant="secondary" onClick={abrirModalPuesto}>Cambiar Puesto</Button>
                    )}
                </div>
                <Table
                    columns={columnasHistorial}
                    data={historial}
                    keyExtractor={(h) => h.id}
                    emptyMessage="Este funcionario aún no tiene historial de puestos."
                />
            </Card>

            <Modal open={showPuestoModal} onClose={() => setShowPuestoModal(false)} title="Cambiar Puesto">
                <CambiarPuestoModal
                    form={puestoForm}
                    areas={listaAreas}
                    puestos={listaPuestos}
                    submitUrl={`/funcionarios/${funcionario.id}/puesto`}
                    onSuccess={() => {
                        setShowPuestoModal(false);
                        puestoForm.reset();
                    }}
                    onCancel={() => setShowPuestoModal(false)}
                />
            </Modal>
        </div>
    );
}
