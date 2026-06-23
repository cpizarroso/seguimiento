import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TreeView } from '@/components/ui/TreeView';
import type { Area, AreaTreeNode } from '@/types/generated/Tramite';

interface AreasIndexProps {
    areasTree: AreaTreeNode[];
}

export default function AreasIndex({ areasTree }: AreasIndexProps) {
    const [search, setSearch] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<AreaTreeNode | null>(null);

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/areas/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const puestosCount = (items: AreaTreeNode[]): number =>
        items.reduce((sum, item) => sum + item.puestos.length + puestosCount(item.children), 0);

    const totalAreas = (items: AreaTreeNode[]): number =>
        items.reduce((sum, item) => sum + 1 + totalAreas(item.children), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-patuju-green">Áreas y Puestos</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {totalAreas(areasTree)} áreas · {puestosCount(areasTree)} puestos
                    </p>
                </div>
                <Link href="/areas/create">
                    <Button>Nueva Área</Button>
                </Link>
            </div>

            <Card padding="sm">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por nombre, sigla o descripción..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftElement={
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                            rightElement={search ? (
                                <button type="button" onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : undefined}
                        />
                    </div>
                </div>
            </Card>

            <Card>
                <TreeView
                    items={areasTree}
                    search={search}
                    onDelete={setDeleteTarget}
                />
            </Card>

            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ¿Estás seguro de eliminar el área <strong>{deleteTarget?.nombre}</strong>?
                        {(deleteTarget?.puestos?.length ?? 0) > 0 && (
                            <span className="block mt-2 text-patuju-red">
                                Esta área tiene {deleteTarget?.puestos.length} puesto(s) asociado(s).
                            </span>
                        )}
                        {(deleteTarget?.children?.length ?? 0) > 0 && (
                            <span className="block mt-1 text-patuju-red">
                                También se eliminarán {deleteTarget?.children.length} sub-área(s).
                            </span>
                        )}
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
