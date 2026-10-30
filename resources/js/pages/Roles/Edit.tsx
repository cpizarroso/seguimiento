import { useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { RolForm } from '@/components/features/roles/RolForm';
import type { PermisosAgrupados, RolData } from '@/types/roles';

interface EditProps {
    rol: RolData;
    permisos_agrupados: PermisosAgrupados;
}

export default function RolesEdit({ rol, permisos_agrupados }: EditProps) {
    const form = useForm({
        nombre: rol.nombre,
        slug: rol.slug,
        descripcion: rol.descripcion ?? '',
        permiso_ids: rol.permiso_ids ?? [],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-excel-green">Editar Rol</h2>
                {rol.es_sistema && <Badge variant="primary">Sistema</Badge>}
            </div>

            <Card>
                <RolForm
                    form={form}
                    permisosAgrupados={permisos_agrupados}
                    submitUrl={`/roles/${rol.id}`}
                    method="put"
                    submitLabel="Actualizar"
                    slugDisabled={rol.es_sistema}
                    autoSlug={false}
                />
            </Card>
        </div>
    );
}
