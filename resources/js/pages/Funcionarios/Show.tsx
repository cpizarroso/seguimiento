import { Link } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Funcionario } from '@/types/generated/Funcionario';

interface ShowProps {
    funcionario: Funcionario;
}

export default function FuncionariosShow({ funcionario }: ShowProps) {
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


        </div>
    );
}
