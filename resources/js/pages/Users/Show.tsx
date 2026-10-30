import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { EstadoUsuarioModal } from '@/components/features/users/EstadoUsuarioModal';
import type { EstadoUsuarioTarget } from '@/components/features/users/EstadoUsuarioModal';
import { ResetPasswordModal, resetPasswordTarget } from '@/components/features/users/ResetPasswordModal';
import type { ResetPasswordTarget } from '@/components/features/users/ResetPasswordModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { PersonaPuesto } from '@/types/generated/Tramite';

interface UserShowData {
    id: number;
    name: string;
    username: string;
    email: string;
    persona_id: number;
    activo: boolean;
    persona: {
        id: number;
        nombres: string;
        apellidos: string;
        nombre_completo: string;
        ci: string;
        telefono: string | null;
        correo: string | null;
        profesion: string | null;
        direccion: string | null;
        activo: boolean;
        area: { id: number; nombre: string; codigo: string } | null;
    } | null;
    puesto_activo?: PersonaPuesto | null;
    historial_puestos?: PersonaPuesto[];
    roles?: { id: number; nombre: string; slug: string }[];
    areas?: { id: number; nombre: string; codigo: string; predeterminada: boolean }[];
    permisos_overrides?: {
        permiso_id: number;
        permitido: boolean;
        modulo: string;
        accion: string;
    }[];
}

interface UsersShowProps {
    user: UserShowData;
}

const ACCIONES: Record<string, string> = {
    consulta: 'Consulta',
    creacion: 'Creación',
    edicion: 'Edición',
    baja: 'Baja',
    tramitacion: 'Tramitación',
    descarga: 'Descarga',
    restauracion: 'Restauración',
};

export default function UsersShow({ user }: UsersShowProps) {
    const { can } = usePermissions();
    const { props } = usePage();
    const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
    const [estadoTarget, setEstadoTarget] = useState<EstadoUsuarioTarget | null>(null);
    const usuarioActualId = props.auth.user?.id ?? null;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-patuju-green">{user.name}</h1>
                        <Badge variant={user.activo ? 'success' : 'danger'}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username} · {user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {can('usuarios', 'edicion') && user.id !== usuarioActualId && (
                        <Button
                            variant="secondary"
                            onClick={() => setEstadoTarget({
                                id: user.id,
                                nombre: user.name,
                                username: user.username,
                                activo: user.activo,
                            })}
                        >
                            <Icon name={user.activo ? 'lock' : 'unlock'} size={15} />
                            {user.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                    )}
                    {can('usuarios', 'edicion') && (
                        <Button variant="secondary" onClick={() => setResetTarget(resetPasswordTarget(user))}>
                            <Icon name="key" size={15} />
                            Resetear contraseña
                        </Button>
                    )}
                    <Link href={`/users/${user.id}/edit`}>
                        <Button variant="secondary">Editar</Button>
                    </Link>
                    <Link href="/users">
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Datos de la cuenta</h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Usuario</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">@{user.username}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Email de acceso</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
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
                <h2 className="mb-4 text-lg font-semibold text-patuju-green">Permisos personalizados</h2>
                {(user.permisos_overrides ?? []).length > 0 ? (
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                        {(user.permisos_overrides ?? []).map((permiso) => (
                            <li
                                key={permiso.permiso_id}
                                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                            >
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {permiso.modulo}.{ACCIONES[permiso.accion] ?? permiso.accion}
                                </span>
                                <Badge variant={permiso.permitido ? 'success' : 'danger'}>
                                    {permiso.permitido ? 'Permitir' : 'Denegar'}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Sin overrides: hereda únicamente los permisos de sus roles.
                    </p>
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
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Teléfono</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.telefono ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Profesión</dt>
                            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.persona.profesion ?? '—'}</dd>
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

            {resetTarget && (
                <ResetPasswordModal
                    key={resetTarget.id}
                    user={resetTarget}
                    onClose={() => setResetTarget(null)}
                />
            )}

            {estadoTarget && (
                <EstadoUsuarioModal
                    key={estadoTarget.id}
                    user={estadoTarget}
                    onClose={() => setEstadoTarget(null)}
                />
            )}
        </div>
    );
}
