import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { RolForm, type PermisoOption } from '@/components/features/roles/RolForm';

interface CreateProps {
    permisos_agrupados?: Record<string, PermisoOption[]>;
}

export default function RolesCreate({ permisos_agrupados }: CreateProps) {
    const form = useForm({
        nombre: '',
        slug: '',
        descripcion: '',
        permiso_ids: [] as number[],
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Nuevo Rol</h2>

            <Card>
                <RolForm form={form} permisosAgrupados={permisos_agrupados} submitUrl="/roles" />
            </Card>
        </div>
    );
}