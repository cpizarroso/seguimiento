import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import type { Area, Puesto } from '@/types/generated/Tramite';

interface ShowProps {
    area: Area;
    flash?: { success?: string };
}

export default function AreasShow({ area }: ShowProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPuesto, setEditingPuesto] = useState<Puesto | null>(null);
    const [deletingPuesto, setDeletingPuesto] = useState<Puesto | null>(null);

    const createForm = useForm({ nombre: '', descripcion: '' });
    const editForm = useForm({ nombre: '', descripcion: '' });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(`/areas/${area.id}/puestos`, {
            preserveState: true,
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (puesto: Puesto) => {
        setEditingPuesto(puesto);
        editForm.setData({ nombre: puesto.nombre, descripcion: puesto.descripcion ?? '' });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPuesto) return;
        editForm.put(`/areas/${area.id}/puestos/${editingPuesto.id}`, {
            preserveState: true,
            onSuccess: () => setEditingPuesto(null),
        });
    };

    const handleDelete = () => {
        if (!deletingPuesto) return;
        router.delete(`/areas/${area.id}/puestos/${deletingPuesto.id}`, {
            preserveState: true,
            onSuccess: () => setDeletingPuesto(null),
        });
    };

    const columns = [
        { key: 'nombre', header: 'Nombre' },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (p: Puesto) => p.descripcion ?? '—',
        },
        {
            key: 'funcionarios_count',
            header: 'Funcionarios',
            render: (p: Puesto) => String((p as Puesto & { funcionarios_count?: number }).funcionarios_count ?? 0),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (p: Puesto) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeletingPuesto(p)}>Eliminar</Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/areas" className="text-sm text-patuju-green hover:underline">&larr; Volver a Áreas</Link>
                    <h2 className="text-2xl font-bold text-patuju-green mt-1">{area.nombre}</h2>
                    {area.descripcion && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{area.descripcion}</p>
                    )}
                </div>
                <Link href={`/areas/${area.id}/edit`}>
                    <Button variant="secondary">Editar Área</Button>
                </Link>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-patuju-green">Puestos del Área</h3>
                    <Button onClick={() => setShowCreateModal(true)}>Nuevo Puesto</Button>
                </div>
                <Table
                    columns={columns}
                    data={area.puestos ?? []}
                    keyExtractor={(p) => p.id}
                    emptyMessage="No hay puestos registrados en esta área."
                />
            </Card>

            <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nuevo Puesto">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Nombre</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={createForm.data.nombre}
                            onChange={(e) => createForm.setData('nombre', e.target.value)}
                        />
                        {createForm.errors.nombre && <p className="text-xs text-patuju-red mt-1">{createForm.errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Descripción</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={createForm.data.descripcion}
                            onChange={(e) => createForm.setData('descripcion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={createForm.processing}>Guardar</Button>
                        <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!editingPuesto} onClose={() => setEditingPuesto(null)} title="Editar Puesto">
                <form onSubmit={handleEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Nombre</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={editForm.data.nombre}
                            onChange={(e) => editForm.setData('nombre', e.target.value)}
                        />
                        {editForm.errors.nombre && <p className="text-xs text-patuju-red mt-1">{editForm.errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Descripción</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={editForm.data.descripcion}
                            onChange={(e) => editForm.setData('descripcion', e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" loading={editForm.processing}>Actualizar</Button>
                        <Button type="button" variant="secondary" onClick={() => setEditingPuesto(null)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deletingPuesto} onClose={() => setDeletingPuesto(null)} title="Confirmar eliminación">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    ¿Estás seguro de eliminar el puesto <strong>{deletingPuesto?.nombre}</strong>?
                </p>
                <div className="flex gap-3">
                    <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
                    <Button variant="secondary" onClick={() => setDeletingPuesto(null)}>Cancelar</Button>
                </div>
            </Modal>
        </div>
    );
}
