import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { RolForm, type PermisoOption } from '@/components/features/roles/RolForm';
import type { PaginatedData } from '@/types/generated/Tramite';

interface RolPermiso {
    id: number;
    modulo: string;
    accion: string;
}

interface RolRow {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string | null;
    es_sistema: boolean;
    permisos: RolPermiso[];
}

interface RolesIndexProps {
    roles: { data: RolRow[] };
    permisos_agrupados?: Record<string, PermisoOption[]>;
}

const accionLabels: Record<string, string> = {
    consulta: 'Consulta',
    creacion: 'Creación',
    edicion: 'Edición',
    baja: 'Baja',
};

export default function RolesIndex({ roles, permisos_agrupados }: RolesIndexProps) {
    const [deleting, setDeleting] = useState<number | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const data = Array.isArray(roles) ? roles : roles.data ?? [];

    const createForm = useForm({
        nombre: '',
        slug: '',
        descripcion: '',
        permiso_ids: [] as number[],
    });

    const handleDelete = (id: number) => {
        if (!confirm('¿Eliminar este rol? Los usuarios con este rol perderán sus permisos.')) return;
        setDeleting(id);
        router.delete(`/roles/${id}`, {
            preserveState: true,
            onFinish: () => setDeleting(null),
        });
    };

    const columns = [
        {
            key: 'nombre',
            header: 'Rol',
            render: (r: RolRow) => (
                <Link href={`/roles/${r.id}/edit`} className="text-patuju-green hover:underline font-medium">
                    {r.nombre}
                </Link>
            ),
        },
        {
            key: 'slug',
            header: 'Slug',
        },
        {
            key: 'permisos',
            header: 'Permisos',
            render: (r: RolRow) => (
                <div className="flex flex-wrap gap-1 max-w-md">
                    {r.permisos.map((p) => (
                        <Badge key={p.id} variant="info" className="text-xs">
                            {p.modulo}.{accionLabels[p.accion] ?? p.accion}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'es_sistema',
            header: 'Tipo',
            render: (r: RolRow) => (
                r.es_sistema
                    ? <Badge variant="primary">Sistema</Badge>
                    : <Badge variant="secondary">Personalizado</Badge>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (r: RolRow) => (
                <div className="flex gap-2">
                    <Link href={`/roles/${r.id}/edit`}>
                        <Button size="sm" variant="secondary">Editar</Button>
                    </Link>
                    {!r.es_sistema && (
                        <Button
                            size="sm"
                            variant="danger"
                            loading={deleting === r.id}
                            onClick={() => handleDelete(r.id)}
                        >
                            Eliminar
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green">Roles</h2>
                <Button onClick={() => setCreateOpen(true)}>Nuevo Rol</Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    data={data}
                    keyExtractor={(r) => r.id}
                    emptyMessage="No hay roles registrados."
                />
            </Card>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Rol">
                <RolForm
                    form={createForm}
                    permisosAgrupados={permisos_agrupados}
                    submitUrl="/roles"
                    onSuccess={() => {
                        setCreateOpen(false);
                        createForm.reset();
                    }}
                    onCancel={() => setCreateOpen(false)}
                />
            </Modal>
        </div>
    );
}
