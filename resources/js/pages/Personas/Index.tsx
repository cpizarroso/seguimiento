import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Table, type Column } from '@/components/ui/Table';
import { PersonaFormModal } from '@/components/features/personas/PersonaFormModal';
import type { AreaOpcion, PaginatedData, Persona, Puesto } from '@/types/generated/Tramite';

interface PersonasIndexProps {
    personas: PaginatedData<Persona>;
    areas: AreaOpcion[];
    puestos: Puesto[];
    filters?: {
        search?: string;
        area_id?: string;
        puesto_id?: string;
        activo?: string;
    };
}

function valorInicial(filtros: PersonasIndexProps['filters'], clave: keyof NonNullable<PersonasIndexProps['filters']>): string {
    return filtros?.[clave] ?? '';
}

export default function PersonasIndex({ personas, areas, puestos, filters }: PersonasIndexProps) {
    const [search, setSearch] = useState(valorInicial(filters, 'search'));
    const [areaId, setAreaId] = useState(valorInicial(filters, 'area_id'));
    const [puestoId, setPuestoId] = useState(valorInicial(filters, 'puesto_id'));
    const [activo, setActivo] = useState(valorInicial(filters, 'activo'));
    const [personaModal, setPersonaModal] = useState<{ open: boolean; persona: Persona | null }>({ open: false, persona: null });
    const [verPersona, setVerPersona] = useState<Persona | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Persona | null>(null);
    const primeraCarga = useRef(true);

    const opcionesArea = useMemo(
        () => areas.map((area) => ({
            value: String(area.id),
            label: area.nombre,
            path: area.path,
            depth: area.depth,
            disabled: !area.activo,
        })),
        [areas],
    );

    const opcionesPuesto = useMemo(() => {
        const filtrados = areaId
            ? puestos.filter((puesto) => String(puesto.area_id) === areaId)
            : puestos;

        return filtrados.map((puesto) => ({
            value: String(puesto.id),
            label: puesto.nombre,
            description: `${puesto.codigo} · ${puesto.area?.nombre ?? ''}`,
        }));
    }, [puestos, areaId]);

    useEffect(() => {
        if (primeraCarga.current) {
            primeraCarga.current = false;
            return;
        }

        const timer = window.setTimeout(() => {
            router.get('/personas', {
                search: search || undefined,
                area_id: areaId || undefined,
                puesto_id: puestoId || undefined,
                activo: activo || undefined,
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search, areaId, puestoId, activo]);

    const limpiar = () => {
        setSearch('');
        setAreaId('');
        setPuestoId('');
        setActivo('');
    };

    const confirmarEliminar = () => {
        if (!deleteTarget) return;

        router.delete(`/personas/${deleteTarget.id}`, {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Persona>[] = [
        {
            key: 'nombre_completo',
            header: 'Persona',
            render: (persona) => (
                <div>
                    <button
                        type="button"
                        onClick={() => setVerPersona(persona)}
                        className="text-left font-medium text-patuju-green hover:underline"
                    >
                        {persona.apellidos}, {persona.nombres}
                    </button>
                    <p className="text-xs text-gray-400">CI: {persona.ci}</p>
                </div>
            ),
        },
        {
            key: 'contacto',
            header: 'Contacto',
            render: (persona) => (
                <div className="text-sm">
                    <p>{persona.correo ?? '—'}</p>
                    <p className="text-xs text-gray-400">{persona.telefono ?? 'Sin teléfono'}</p>
                </div>
            ),
        },
        {
            key: 'area_puesto',
            header: 'Área y puesto',
            render: (persona) => (
                <div className="text-sm">
                    <p>{persona.area?.nombre ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                        {persona.puesto_activo?.puesto?.nombre ?? 'Sin puesto vigente'}
                    </p>
                </div>
            ),
        },
        {
            key: 'usuario',
            header: 'Usuario',
            render: (persona) => persona.user
                ? <Badge variant="info">{persona.user.email}</Badge>
                : <span className="text-xs text-gray-400">Sin usuario</span>,
        },
        {
            key: 'activo',
            header: 'Estado',
            render: (persona) => (
                <Badge variant={persona.activo ? 'success' : 'danger'}>
                    {persona.activo ? 'Activa' : 'Inactiva'}
                </Badge>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            render: (persona) => (
                <div className="flex justify-end gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setVerPersona(persona)}>
                        Ver
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setPersonaModal({ open: true, persona })}>
                        Editar
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.put(`/personas/${persona.id}/toggle`, {}, { preserveScroll: true })}
                    >
                        {persona.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(persona)}>
                        Eliminar
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Personas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Personas, puesto vigente y usuario vinculado.
                    </p>
                </div>
                <Button onClick={() => setPersonaModal({ open: true, persona: null })}>
                    Nueva persona
                </Button>
            </div>

            <Card padding="sm">
                <div className="grid gap-3 lg:grid-cols-4">
                    <Input
                        label="Buscar"
                        placeholder="Nombre, CI o correo..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <SearchableSelect
                        label="Área"
                        options={opcionesArea}
                        value={areaId || null}
                        onChange={(value) => {
                            setAreaId(value ?? '');
                            setPuestoId('');
                        }}
                        placeholder="Todas las áreas"
                        searchPlaceholder="Buscar área..."
                        clearable
                        clearLabel="Todas las áreas"
                    />
                    <SearchableSelect
                        label="Puesto"
                        options={opcionesPuesto}
                        value={puestoId || null}
                        onChange={(value) => setPuestoId(value ?? '')}
                        placeholder="Todos los puestos"
                        searchPlaceholder="Buscar puesto..."
                        clearable
                        clearLabel="Todos los puestos"
                    />
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="mb-1 block text-sm font-medium text-patuju-green">Estado</label>
                            <select
                                value={activo}
                                onChange={(event) => setActivo(event.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Todos</option>
                                <option value="1">Activas</option>
                                <option value="0">Inactivas</option>
                            </select>
                        </div>
                        <Button variant="secondary" onClick={limpiar}>
                            Limpiar
                        </Button>
                    </div>
                </div>
            </Card>

            <Card padding="sm">
                <Table
                    columns={columns}
                    data={personas.data}
                    keyExtractor={(persona) => persona.id}
                    emptyMessage="No se encontraron personas."
                />

                <Pagination
                    currentPage={personas.meta.current_page}
                    lastPage={personas.meta.last_page}
                    from={personas.meta.from}
                    to={personas.meta.to}
                    total={personas.meta.total}
                    perPage={personas.meta.per_page}
                    label="personas"
                    onPageChange={(page) => router.get('/personas', {
                        search: search || undefined,
                        area_id: areaId || undefined,
                        puesto_id: puestoId || undefined,
                        activo: activo || undefined,
                        page,
                    }, { preserveState: true, preserveScroll: true })}
                />
            </Card>

            <PersonaFormModal
                open={personaModal.open}
                onClose={() => setPersonaModal({ open: false, persona: null })}
                persona={personaModal.persona}
                areas={areas}
                puestos={puestos}
            />

            <Modal
                open={verPersona !== null}
                onClose={() => setVerPersona(null)}
                title="Detalle de la persona"
                maxWidth="2xl"
            >
                {verPersona && (
                    <div className="space-y-4 text-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div><span className="text-gray-500">Nombres:</span> {verPersona.nombres}</div>
                            <div><span className="text-gray-500">Apellidos:</span> {verPersona.apellidos}</div>
                            <div><span className="text-gray-500">CI:</span> {verPersona.ci}</div>
                            <div><span className="text-gray-500">Teléfono:</span> {verPersona.telefono ?? '—'}</div>
                            <div><span className="text-gray-500">Correo:</span> {verPersona.correo ?? '—'}</div>
                            <div><span className="text-gray-500">Dirección:</span> {verPersona.direccion ?? '—'}</div>
                            <div><span className="text-gray-500">Área:</span> {verPersona.area?.nombre ?? '—'}</div>
                            <div><span className="text-gray-500">Puesto vigente:</span> {verPersona.puesto_activo?.puesto?.nombre ?? '—'}</div>
                            <div><span className="text-gray-500">Usuario:</span> {verPersona.user?.email ?? 'Sin usuario'}</div>
                            <div><span className="text-gray-500">Estado:</span> {verPersona.activo ? 'Activa' : 'Inactiva'}</div>
                        </div>

                        <div>
                            <h3 className="mb-2 font-semibold text-patuju-green">Historial de puestos</h3>
                            {verPersona.historial_puestos && verPersona.historial_puestos.length > 0 ? (
                                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                                    {verPersona.historial_puestos.map((registro) => (
                                        <li key={registro.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                            <div>
                                                <p className="font-medium">{registro.puesto?.nombre ?? 'Puesto eliminado'}</p>
                                                <p className="text-xs text-gray-400">{registro.puesto?.area?.nombre ?? '—'}</p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {registro.fecha_inicio ?? '—'} → {registro.fecha_fin ?? 'vigente'}
                                                {registro.vigente && <Badge variant="success" className="ml-2">Vigente</Badge>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400">Sin historial registrado.</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        ¿Eliminar a <strong>{deleteTarget?.nombre_completo}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={confirmarEliminar}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
