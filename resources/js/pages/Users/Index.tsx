import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import { Table, type Column } from '@/components/ui/Table';
import { UserForm } from '@/components/features/users/UserForm';
import type { RolOption } from '@/components/features/users/UserForm';
import type { Area, PaginatedData, Persona } from '@/types/generated/Tramite';

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profesion: string | null;
    persona_id: number | null;
    persona?: Persona | null;
    roles?: { id: number; nombre: string }[];
    areas?: { id: number; predeterminada: boolean }[];
    area_predeterminada_id?: number | null;
}

interface UsersIndexProps {
    users: PaginatedData<UserRow>;
    roles?: { data: RolOption[] };
    personas?: { data: Persona[] };
    areas?: { data: Area[] };
}

const VINCULACION_OPTIONS = [
    { value: '', label: 'Todas' },
    { value: '1', label: 'Con persona' },
    { value: '0', label: 'Sin persona' },
];

export default function UsersIndex({ users, roles, personas, areas }: UsersIndexProps) {
    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1] ?? '');

    const [search, setSearch] = useState(params.get('search') ?? '');
    const [roleId, setRoleId] = useState(params.get('role_id') ?? '');
    const [areaId, setAreaId] = useState(params.get('area_id') ?? '');
    const [conPersona, setConPersona] = useState(params.get('con_persona') ?? '');
    const [createOpen, setCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const hayFiltros = search !== '' || roleId !== '' || areaId !== '' || conPersona !== '';

    const rolOptions = (roles?.data ?? []).map((rol) => ({
        value: String(rol.id),
        label: rol.nombre,
    }));

    const areaOptions = (areas?.data ?? []).map((area) => ({
        value: String(area.id),
        label: `${area.codigo} · ${area.nombre}`,
    }));

    const createForm = useForm({
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

    const editForm = useForm({
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

    const filtrosActuales = (overrides: Record<string, string | number | undefined> = {}) => ({
        search: search || undefined,
        role_id: roleId || undefined,
        area_id: areaId || undefined,
        con_persona: conPersona || undefined,
        ...overrides,
    });

    useEffect(() => {
        if (!createOpen) {
            searchInputRef.current?.focus();
        }
    }, [createOpen]);

    const buscar = () => {
        router.get('/users', filtrosActuales({ page: undefined }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarBusqueda = () => {
        setSearch('');
        router.get('/users', filtrosActuales({ search: undefined, page: 1 }), {
            preserveState: true,
            preserveScroll: true,
        });
        searchInputRef.current?.focus();
    };

    const filtrarRol = (value: string) => {
        setRoleId(value);
        router.get('/users', filtrosActuales({ role_id: value || undefined, page: 1 }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const filtrarArea = (value: string) => {
        setAreaId(value);
        router.get('/users', filtrosActuales({ area_id: value || undefined, page: 1 }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const filtrarVinculacion = (value: string) => {
        setConPersona(value);
        router.get('/users', filtrosActuales({ con_persona: value || undefined, page: 1 }), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarFiltros = () => {
        setSearch('');
        setRoleId('');
        setAreaId('');
        setConPersona('');
        router.get('/users', {}, { preserveState: true, preserveScroll: true });
        searchInputRef.current?.focus();
    };

    const abrirEdicion = (user: UserRow) => {
        const areasUsuario = user.areas ?? [];
        const predeterminada = user.area_predeterminada_id
            ? String(user.area_predeterminada_id)
            : areasUsuario[0]
                ? String(areasUsuario[0].id)
                : '';

        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            profesion: user.profesion ?? '',
            password: '',
            persona_id: user.persona_id ? String(user.persona_id) : '',
            role_ids: (user.roles ?? []).map((rol) => rol.id),
            area_ids: areasUsuario.map((area) => area.id),
            area_predeterminada_id: predeterminada,
        });
        editForm.clearErrors();
        setEditUser(user);
    };

    const columns: Column<UserRow>[] = [
        {
            key: 'name',
            header: 'Usuario',
            render: (user) => (
                <div>
                    <Link href={`/users/${user.id}`} className="font-medium text-patuju-green hover:underline">
                        {user.name}
                    </Link>
                    <p className="text-xs text-gray-400">{user.email}</p>
                </div>
            ),
        },
        {
            key: 'persona',
            header: 'Persona',
            render: (user) => user.persona
                ? (
                    <div className="text-sm">
                        <p>{user.persona.nombre_completo}</p>
                        <p className="text-xs text-gray-400">
                            {user.persona.puesto_activo?.puesto?.nombre ?? 'Sin puesto vigente'}
                        </p>
                    </div>
                )
                : <span className="text-xs text-gray-400">Sin persona vinculada</span>,
        },
        {
            key: 'roles',
            header: 'Roles',
            render: (user) => (
                <div className="flex flex-wrap gap-1">
                    {(user.roles ?? []).map((rol) => (
                        <Badge key={rol.id} variant="info">{rol.nombre}</Badge>
                    ))}
                    {(user.roles ?? []).length === 0 && <span className="text-xs text-gray-400">Sin roles</span>}
                </div>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            render: (user) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/users/${user.id}`}>
                        <Button size="sm" variant="secondary">Ver</Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicion(user)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(user)}>Eliminar</Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-patuju-green">Usuarios</h1>
                    <p className="text-sm text-gray-500">Cuentas vinculadas a una persona.</p>
                </div>
                <Button onClick={() => {
                    createForm.reset();
                    createForm.clearErrors();
                    setCreateOpen(true);
                }}>
                    Nuevo usuario
                </Button>
            </div>

            <Card padding="sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="w-full lg:max-w-md">
                        <div className="flex h-9 w-full items-center rounded-md border border-excel-border-strong bg-excel-surface shadow-sm transition-colors focus-within:border-excel-green focus-within:ring-2 focus-within:ring-excel-green/20 dark:border-gray-600 dark:bg-gray-800">
                            <span className="flex flex-shrink-0 items-center pl-3 text-excel-muted dark:text-gray-500">
                                <Icon name="search" size={17} />
                            </span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && buscar()}
                                placeholder="Buscar por usuario, nombre, apellido o CI..."
                                aria-label="Buscar usuarios"
                                className="h-9 w-full border-none bg-transparent px-3 text-sm text-excel-text outline-none placeholder:text-excel-muted/70 dark:text-gray-100 dark:placeholder:text-gray-500"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={limpiarBusqueda}
                                    className="flex-shrink-0 px-2 text-excel-muted transition-colors hover:text-excel-text dark:text-gray-400 dark:hover:text-gray-200"
                                    title="Limpiar búsqueda"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <Icon name="close" size={14} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={buscar}
                                className="mr-1 h-7 flex-shrink-0 rounded bg-excel-green px-3.5 text-xs font-semibold text-white transition-colors hover:bg-excel-green-dark"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                        <SearchableSelect
                            id="filtro-rol"
                            ariaLabel="Rol"
                            value={roleId || null}
                            onChange={(value) => filtrarRol(value ?? '')}
                            options={rolOptions}
                            placeholder="Todos los roles"
                            searchPlaceholder="Buscar rol..."
                            emptyMessage="No se encontraron roles."
                            clearable
                            clearLabel="Todos los roles"
                            showPath={false}
                            className="w-full sm:w-48"
                        />
                        <SearchableSelect
                            id="filtro-area"
                            ariaLabel="Área"
                            value={areaId || null}
                            onChange={(value) => filtrarArea(value ?? '')}
                            options={areaOptions}
                            placeholder="Todas las áreas"
                            searchPlaceholder="Buscar área..."
                            emptyMessage="No se encontraron áreas."
                            clearable
                            clearLabel="Todas las áreas"
                            showPath={false}
                            className="w-full sm:w-60"
                        />
                        <Select
                            aria-label="Vinculación"
                            value={conPersona}
                            onChange={(e) => filtrarVinculacion(e.target.value)}
                            options={VINCULACION_OPTIONS}
                            className="w-full sm:w-40"
                        />
                        {hayFiltros && (
                            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
                                <Icon name="close" size={14} />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={users.data}
                    keyExtractor={(user) => user.id}
                    emptyMessage="No se encontraron usuarios con los filtros aplicados."
                />
                <Pagination
                    currentPage={users.meta.current_page}
                    lastPage={users.meta.last_page}
                    from={users.meta.from}
                    to={users.meta.to}
                    total={users.meta.total}
                    perPage={users.meta.per_page}
                    label="usuarios"
                    onPageChange={(page) => router.get('/users', filtrosActuales({ page }), { preserveState: true, preserveScroll: true })}
                    onPerPageChange={(perPage) => router.get('/users', filtrosActuales({ per_page: perPage, page: 1 }), { preserveState: true, preserveScroll: true })}
                />
            </Card>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario" maxWidth="2xl">
                <UserForm
                    form={createForm}
                    roles={roles}
                    personas={personas}
                    areas={areas}
                    submitUrl="/users"
                    onSuccess={() => setCreateOpen(false)}
                    onCancel={() => setCreateOpen(false)}
                />
            </Modal>

            <Modal open={editUser !== null} onClose={() => setEditUser(null)} title="Editar usuario" maxWidth="2xl">
                {editUser && (
                    <UserForm
                        form={editForm}
                        roles={roles}
                        personas={personas}
                        areas={areas}
                        submitUrl={`/users/${editUser.id}`}
                        method="put"
                        isEditing
                        personaActualId={editUser.persona_id}
                        onSuccess={() => setEditUser(null)}
                        onCancel={() => setEditUser(null)}
                    />
                )}
            </Modal>

            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        ¿Eliminar al usuario <strong>{deleteTarget?.name}</strong>? La persona vinculada no se elimina.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (!deleteTarget) return;
                                router.delete(`/users/${deleteTarget.id}`, {
                                    preserveScroll: true,
                                    onFinish: () => setDeleteTarget(null),
                                });
                            }}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}