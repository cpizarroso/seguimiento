import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { PersonaPuesto } from '@/types/generated/Tramite';

interface UserShowData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profesion: string | null;
    persona_id: number | null;
    persona: {
        id: number;
        nombres: string;
        apellidos: string;
        nombre_completo: string;
        ci: string;
        telefono: string | null;
        correo: string | null;
        direccion: string | null;
        activo: boolean;
        area: { id: number; nombre: string; codigo: string } | null;
    } | null;
    puesto_activo?: PersonaPuesto | null;
    historial_puestos?: PersonaPuesto[];
    roles?: { id: number; nombre: string; slug: string }[];
    areas?: { id: number; nombre: string; codigo: string; predeterminada: boolean }[];
}

interface UsersShowProps {
    user: UserShowData;
}

export default function UsersShow({ user }: UsersShowProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-patuju-green">{user.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/users/${user.id}/edit`}>
                        <Button variant="secondary">Editar</Button>
                    </Link>
                    <Link href="/users">
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Datos del usuario</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Correo</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Teléfono</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Profesión</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.profesion ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Roles</dt>
                        <dd className="mt-1 flex flex-wrap gap-1">
                            {(user.roles ?? []).map((rol) => (
                                <Badge key={rol.id} variant="info">{rol.nombre}</Badge>
                            ))}
                            {(user.roles ?? []).length === 0 && <span className="text-sm text-gray-400 dark:text-gray-500">Sin roles</span>}
                        </dd>
                    </div>
                </dl>
            </Card>

            <Card>
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Áreas habilitadas para crear trámites</h2>
                {(user.areas ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {(user.areas ?? []).map((area) => (
                            <Badge key={area.id} variant={area.predeterminada ? 'success' : 'default'}>
                                {area.codigo} · {area.nombre}
                                {area.predeterminada ? ' · Predeterminada' : ''}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin áreas habilitadas.</p>
                )}
            </Card>

            <Card>
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Persona vinculada</h2>
                {user.persona ? (
                    <dl className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre completo</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.nombre_completo}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">CI</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.ci}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Área</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.area?.nombre ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Puesto vigente</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.puesto_activo?.puesto?.nombre ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Estado</dt>
                            <dd>
                                <Badge variant={user.persona.activo ? 'success' : 'danger'}>
                                    {user.persona.activo ? 'Activa' : 'Inactiva'}
                                </Badge>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Correo de la persona</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.correo ?? '—'}</dd>
                        </div>
                    </dl>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Este usuario no tiene persona vinculada.</p>
                )}
            </Card>

            <Card>
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Historial de puestos</h2>
                {user.historial_puestos && user.historial_puestos.length > 0 ? (
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                        {user.historial_puestos.map((registro) => (
                            <li key={registro.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{registro.puesto?.nombre ?? 'Puesto eliminado'}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{registro.puesto?.area?.nombre ?? '—'}</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {registro.fecha_inicio ?? '—'} → {registro.fecha_fin ?? 'vigente'}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">Sin historial registrado.</p>
                )}
            </Card>
        </div>
    );
}
