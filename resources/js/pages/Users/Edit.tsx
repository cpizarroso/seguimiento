import { router, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { UserForm } from '@/components/features/users/UserForm';
import type { Area, Persona } from '@/types/generated/Tramite';
import type { RolOption } from '@/components/features/users/UserForm';

interface UserEditData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profesion: string | null;
    persona_id: number | null;
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
    const areasUsuario = user.areas ?? [];
    const predeterminada = user.area_predeterminada_id
        ? String(user.area_predeterminada_id)
        : areasUsuario[0]
            ? String(areasUsuario[0].id)
            : '';

    const form = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        profesion: user.profesion ?? '',
        password: '',
        persona_id: user.persona_id ? String(user.persona_id) : '',
        role_ids: (user.roles ?? []).map((rol) => rol.id),
        area_ids: areasUsuario.map((area) => area.id),
        area_predeterminada_id: predeterminada,
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-patuju-green">Editar usuario</h1>
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
        </div>
    );
}