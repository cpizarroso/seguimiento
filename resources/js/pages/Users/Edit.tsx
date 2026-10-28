import { router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { EstadoUsuarioModal } from '@/components/features/users/EstadoUsuarioModal';
import type { EstadoUsuarioTarget } from '@/components/features/users/EstadoUsuarioModal';
import { ResetPasswordModal, resetPasswordTarget } from '@/components/features/users/ResetPasswordModal';
import type { ResetPasswordTarget } from '@/components/features/users/ResetPasswordModal';
import { UserForm } from '@/components/features/users/UserForm';
import { usePermissions } from '@/hooks/usePermissions';
import type { Area, Persona } from '@/types/generated/Tramite';
import type { RolOption } from '@/components/features/users/UserForm';

interface UserEditData {
    id: number;
    name: string;
    username: string;
    email: string;
    persona_id: number;
    activo: boolean;
    persona?: Persona | null;
    roles?: { id: number }[];
    areas?: { id: number; predeterminada: boolean }[];
    area_predeterminada_id?: number | null;
}

interface UsersEditProps {
    user: UserEditData;
    roles?: { data: RolOption[] };
    personas?: { data: Persona[] };
    areas?: { data: Area[] };
}

export default function UsersEdit({ user, roles, personas, areas }: UsersEditProps) {
    const { can } = usePermissions();
    const { props } = usePage();
    const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
    const [estadoTarget, setEstadoTarget] = useState<EstadoUsuarioTarget | null>(null);
    const usuarioActualId = props.auth.user?.id ?? null;

    const areasUsuario = user.areas ?? [];
    const predeterminada = user.area_predeterminada_id
        ? String(user.area_predeterminada_id)
        : areasUsuario[0]
            ? String(areasUsuario[0].id)
            : '';

    const form = useForm({
        username: user.username,
        email: user.email,
        password: '',
        persona_id: user.persona_id ? String(user.persona_id) : '',
        role_ids: (user.roles ?? []).map((rol) => rol.id),
        area_ids: areasUsuario.map((area) => area.id),
        area_predeterminada_id: predeterminada,
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold text-patuju-green">Editar usuario</h1>
                        <Badge variant={user.activo ? 'success' : 'danger'}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username} · {user.name}</p>
                </div>
                {can('usuarios', 'edicion') && (
                    <div className="flex flex-wrap gap-2">
                        {user.id !== usuarioActualId && (
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
                        <Button variant="secondary" onClick={() => setResetTarget(resetPasswordTarget(user))}>
                            <Icon name="key" size={15} />
                            Resetear contraseña
                        </Button>
                    </div>
                )}
            </div>
            <Card>
                <UserForm
                    form={form}
                    roles={roles}
                    personas={personas}
                    areas={areas}
                    submitUrl={`/users/${user.id}`}
                    method="put"
                    isEditing
                    personaActualId={user.persona_id}
                    onCancel={() => router.visit('/users')}
                />
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