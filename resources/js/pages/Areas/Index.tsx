import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AreaFormModal } from '@/components/features/areas/AreaFormModal';
import { PuestoFormModal } from '@/components/features/areas/PuestoFormModal';
import type { AreaOpcion, AreaTreeNode, Puesto } from '@/types/generated/Tramite';

interface Responsable {
    id: number;
    name: string;
    email: string;
}

interface AreasIndexProps {
    areasTree: AreaTreeNode[];
    areasOpciones: AreaOpcion[];
    responsables: Responsable[];
}

type DeleteTarget =
    | { tipo: 'area'; area: AreaTreeNode }
    | { tipo: 'puesto'; area: AreaTreeNode; puesto: Puesto };

function normalizar(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function areaCoincide(area: AreaTreeNode, termino: string): boolean {
    if (!termino) return true;

    const textos = [
        area.nombre,
        area.codigo,
        area.descripcion ?? '',
        area.responsable?.name ?? '',
        ...area.puestos.map((puesto) => `${puesto.nombre} ${puesto.codigo}`),
    ];

    return textos.some((texto) => normalizar(texto).includes(termino));
}

function filtrarArbol(areas: AreaTreeNode[], termino: string): AreaTreeNode[] {
    if (!termino) return areas;

    return areas
        .map((area) => {
            const children = filtrarArbol(area.children, termino);
            if (areaCoincide(area, termino) || children.length > 0) {
                return { ...area, children };
            }
            return null;
        })
        .filter((area): area is AreaTreeNode => area !== null);
}

interface AreaNodeProps {
    area: AreaTreeNode;
    onNuevaSubarea: (area: AreaTreeNode) => void;
    onEditarArea: (area: AreaTreeNode) => void;
    onNuevaPuesto: (area: AreaTreeNode) => void;
    onEditarPuesto: (area: AreaTreeNode, puesto: Puesto) => void;
    onEliminar: (target: DeleteTarget) => void;
}

function AreaNode({
    area,
    onNuevaSubarea,
    onEditarArea,
    onNuevaPuesto,
    onEditarPuesto,
    onEliminar,
}: AreaNodeProps) {
    const [abierto, setAbierto] = useState(true);

    return (
        <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                        {area.children.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setAbierto((valor) => !valor)}
                                className="mt-0.5 text-gray-400 hover:text-patuju-green"
                                aria-label={abierto ? 'Contraer subáreas' : 'Expandir subáreas'}
                            >
                                {abierto ? '▾' : '▸'}
                            </button>
                        )}
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-patuju-green">{area.nombre}</h3>
                                <span className="rounded bg-patuju-cream px-2 py-0.5 font-mono text-xs text-patuju-green dark:bg-gray-700">
                                    {area.codigo}
                                </span>
                                <Badge variant={area.activo ? 'success' : 'danger'}>
                                    {area.activo ? 'Activa' : 'Inactiva'}
                                </Badge>
                            </div>
                            {area.descripcion && (
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{area.descripcion}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{area.puestos_count} puestos</span>
                                <span>{area.personas_count} personas</span>
                                <span>{area.usuarios_count} usuarios</span>
                                {area.responsable && <span>Responsable: {area.responsable.name}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => onNuevaSubarea(area)}>
                            Nueva subárea
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => onEditarArea(area)}>
                            Editar
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.put(`/areas/${area.id}/toggle`, {}, { preserveScroll: true })}
                        >
                            {area.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onEliminar({ tipo: 'area', area })}>
                            Eliminar
                        </Button>
                    </div>
                </div>

                <div className="mt-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-700">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Puestos</span>
                        <Button size="sm" variant="secondary" onClick={() => onNuevaPuesto(area)}>
                            Agregar puesto
                        </Button>
                    </div>

                    {area.puestos.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-gray-400">Esta área todavía no tiene puestos.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {area.puestos.map((puesto) => (
                                <li key={puesto.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{puesto.nombre}</span>
                                        <span className="font-mono text-xs text-gray-400">{puesto.codigo}</span>
                                        <Badge variant={puesto.activo ? 'success' : 'danger'}>
                                            {puesto.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                            {puesto.personas_count} personas · {puesto.usuarios_count} usuarios
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-patuju-green hover:underline"
                                            onClick={() => onEditarPuesto(area, puesto)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-patuju-green hover:underline"
                                            onClick={() => router.put(`/areas/${area.id}/puestos/${puesto.id}/toggle`, {}, { preserveScroll: true })}
                                        >
                                            {puesto.activo ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button
                                            type="button"
                                            className="text-xs font-medium text-patuju-red hover:underline"
                                            onClick={() => onEliminar({ tipo: 'puesto', area, puesto })}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {abierto && area.children.length > 0 && (
                <div className="ml-4 space-y-3 border-l-2 border-patuju-green/20 pl-4">
                    {area.children.map((hijo) => (
                        <AreaNode
                            key={hijo.id}
                            area={hijo}
                            onNuevaSubarea={onNuevaSubarea}
                            onEditarArea={onEditarArea}
                            onNuevaPuesto={onNuevaPuesto}
                            onEditarPuesto={onEditarPuesto}
                            onEliminar={onEliminar}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AreasIndex({ areasTree, areasOpciones, responsables }: AreasIndexProps) {
    const [search, setSearch] = useState('');
    const [areaModal, setAreaModal] = useState<{ open: boolean; area: AreaTreeNode | null; parentId: number | null }>({
        open: false,
        area: null,
        parentId: null,
    });
    const [puestoModal, setPuestoModal] = useState<{ open: boolean; area: AreaTreeNode | null; puesto: Puesto | null }>({
        open: false,
        area: null,
        puesto: null,
    });
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    const filtradas = useMemo(() => filtrarArbol(areasTree, normalizar(search.trim())), [areasTree, search]);

    const confirmarEliminar = () => {
        if (!deleteTarget) return;

        const url = deleteTarget.tipo === 'area'
            ? `/areas/${deleteTarget.area.id}`
            : `/areas/${deleteTarget.area.id}/puestos/${deleteTarget.puesto.id}`;

        router.delete(url, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Áreas y Puestos</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Estructura organizacional, puestos y personas vinculadas.
                    </p>
                </div>
                <Button onClick={() => setAreaModal({ open: true, area: null, parentId: null })}>
                    Nueva área
                </Button>
            </div>

            <Card>
                <Input
                    placeholder="Buscar por nombre, código, descripción, responsable o puesto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </Card>

            {filtradas.length === 0 ? (
                <Card>
                    <p className="py-8 text-center text-sm text-gray-400">
                        {search ? 'No se encontraron áreas con ese criterio.' : 'No hay áreas registradas.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filtradas.map((area) => (
                        <AreaNode
                            key={area.id}
                            area={area}
                            onNuevaSubarea={(padre) => setAreaModal({ open: true, area: null, parentId: padre.id })}
                            onEditarArea={(areaSeleccionada) => setAreaModal({ open: true, area: areaSeleccionada, parentId: null })}
                            onNuevaPuesto={(areaSeleccionada) => setPuestoModal({ open: true, area: areaSeleccionada, puesto: null })}
                            onEditarPuesto={(areaSeleccionada, puesto) => setPuestoModal({ open: true, area: areaSeleccionada, puesto })}
                            onEliminar={setDeleteTarget}
                        />
                    ))}
                </div>
            )}

            <AreaFormModal
                open={areaModal.open}
                onClose={() => setAreaModal({ open: false, area: null, parentId: null })}
                area={areaModal.area}
                defaultParentId={areaModal.parentId}
                areasOpciones={areasOpciones}
                responsables={responsables}
            />

            <PuestoFormModal
                open={puestoModal.open}
                onClose={() => setPuestoModal({ open: false, area: null, puesto: null })}
                area={puestoModal.area}
                puesto={puestoModal.puesto}
            />

            <Modal
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title="Confirmar eliminación"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        ¿Eliminar {deleteTarget?.tipo === 'area' ? 'el área' : 'el puesto'}{' '}
                        <strong>
                            {deleteTarget?.tipo === 'area'
                                ? deleteTarget.area.nombre
                                : deleteTarget?.puesto?.nombre}
                        </strong>?
                        Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={confirmarEliminar}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
