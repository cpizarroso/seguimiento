import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { UserForm, type AreaOption, type FuncionarioOption, type PuestoOption, type RolOption } from '@/components/features/users/UserForm';

interface CreateProps {
    areas?: { data: AreaOption[] };
    puestos?: { data: PuestoOption[] };
    roles?: { data: RolOption[] };
    funcionarios?: { data: FuncionarioOption[] };
}

export default function UsersCreate({ areas, puestos, roles, funcionarios }: CreateProps) {
    const form = useForm({
        name: '',
        email: '',
        phone: '',
        profesion: '',
        password: '',
        funcionario_id: '',
        role_ids: [] as number[],
        area_id: '',
        puesto_id: '',
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Nuevo Usuario</h2>

            <Card>
                <UserForm
                    form={form}
                    areas={areas}
                    puestos={puestos}
                    roles={roles}
                    funcionarios={funcionarios}
                    submitUrl="/users"
                />
            </Card>
        </div>
    );
}