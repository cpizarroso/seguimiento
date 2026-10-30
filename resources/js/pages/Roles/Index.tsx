import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { RolForm } from '@/components/features/roles/RolForm';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermisosAgrupados, RolRow } from '@/types/roles';

interface RolesIndexProps {
    roles: { data: RolRow[] } | RolRow[];
    permisos_agrupados?: PermisosAgrupados;
}

export default function RolesIndex({ roles, permisos_agrupados }: RolesIndexProps) {
    const { can } = usePermissions();
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<RolRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const data = Array.isArray(roles) ? roles : roles.data ?? [];

    const puedeCrear = can('roles', 'creacion');
    const puedeEditar = can('roles', 'edicion');
    const puedeEliminar = can('roles', 'baja');

    const createForm = useForm({
        nombre: '',
        slug: '',
        descripcion: '',
        permiso_ids: [] as number[],
    });

    const confirmarEliminar = () => {
        if (!deleteTarget) return;

        router.delete(`/roles/${deleteTarget.id}`, {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const usuariosAfectados = deleteTarget?.usuarios_count ?? 0;

    const columns = [
        {
            key: 'nombre',
            header: 'Rol',
            render: (r: RolRow) => (
                puedeEditar
                    ? <Link href={`/roles/${r.id}/edit`} className="font-medium text-excel-green hover:underline">{r.nombre}</Link>
                    : <span className="font-medium">{r.nombre}</span>
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
                <div className="flex max-w-md flex-wrap gap-1">
                    {r.permisos.map((p) => (
                        <Badge key={p.id} variant="info" className="text-xs">
                            {p.modulo}.{p.accion_nombre ?? p.accion}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'usuarios_count',
            header: 'Usuarios',
            render: (r: RolRow) => (
                <span className="text-excel-muted">{r.usuarios_count ?? 0}</span>
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
                    {puedeEditar && (
                        <Link href={`/roles/${r.id}/edit`}>
                            <Button size="sm" variant="secondary">Editar</Button>
                        </Link>
                    )}
                    {puedeEliminar && !r.es_sistema && (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteTarget(r)}
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
                <h2 className="text-2xl font-bold text-excel-green">Roles</h2>
                {puedeCrear && <Button onClick={() => setCreateOpen(true)}>Nuevo Rol</Button>}
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

            <Modal
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title="Eliminar rol"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-excel-text dark:text-gray-200">
                        ¿Eliminar el rol «{deleteTarget?.nombre}»?
                    </p>
                    <p className="text-sm text-excel-muted">
                        {usuariosAfectados > 0
                            ? `${usuariosAfectados} usuario(s) tienen este rol y perderán sus permisos.`
                            : 'Ningún usuario tiene este rol asignado.'}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" loading={deleting} onClick={confirmarEliminar}>
                            Eliminar rol
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
