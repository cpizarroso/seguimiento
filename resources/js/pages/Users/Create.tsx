import { router, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { UserForm } from '@/components/features/users/UserForm';
import type { Area, Persona } from '@/types/generated/Tramite';
import type { RolOption } from '@/components/features/users/UserForm';

interface UsersCreateProps {
    roles?: { data: RolOption[] };
    personas?: { data: Persona[] };
    areas?: { data: Area[] };
}

export default function UsersCreate({ roles, personas, areas }: UsersCreateProps) {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        profesion: '',
        password: '',
        persona_id: '',
        role_ids: [] as number[],
        area_ids: [] as number[],
        area_predeterminada_id: '',
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-patuju-green">Nuevo usuario</h1>
            <Card>
                <UserForm
                    form={form}
                    roles={roles}
                    personas={personas}
                    areas={areas}
                    submitUrl="/users"
                    onCancel={() => router.visit('/users')}
                />
            </Card>
        </div>
    );
}