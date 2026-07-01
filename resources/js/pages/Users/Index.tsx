import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginatedData } from '@/types/generated/Tramite';

interface AreaInfo {
    id: number;
    nombre: string;
    sigla: string;
}

interface PuestoInfo {
    id: number;
    nombre: string;
    sigla: string;
    area_id: number;
    area: AreaInfo | null;
}

interface PuestoActivoRow {
    id: number;
    puesto_id: number;
    puesto: PuestoInfo | null;
}

interface UserRoleRow {
    id: number;
    nombre: string;
    slug: string;
}

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profesion: string | null;
    role: string;
    roles: UserRoleRow[];
    puesto_activo?: PuestoActivoRow | null;
}

interface UsersIndexProps {
    users: PaginatedData<UserRow>;
}

export default function UsersIndex({ users }: UsersIndexProps) {
    const [search, setSearch] = useState('');

    const columns = [
        {
            key: 'name',
            header: 'Nombre',
            render: (u: UserRow) => (
                <Link href={`/users/${u.id}`} className="text-patuju-green hover:underline font-medium">
                    {u.name}
                </Link>
            ),
        },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Teléfono', render: (u: UserRow) => u.phone ?? '—' },
        { key: 'profesion', header: 'Profesión', render: (u: UserRow) => u.profesion ?? '—' },
        {
            key: 'puesto',
            header: 'Puesto',
            render: (u: UserRow) =>
                u.puesto_activo?.puesto
                    ? `${u.puesto_activo.puesto.nombre} (${u.puesto_activo.puesto.area?.nombre ?? '—'})`
                    : '—',
        },
        {
            key: 'roles',
            header: 'Roles',
            render: (u: UserRow) => (
                <div className="flex flex-wrap gap-1">
                    {(u.roles ?? []).map((r) => (
                        <Badge key={r.id} variant="primary">{r.nombre}</Badge>
                    ))}
                    {(!u.roles || u.roles.length === 0) && <span className="text-xs text-gray-400">—</span>}
                </div>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (u: UserRow) => (
                <div className="flex gap-2">
                    <Link href={`/users/${u.id}/edit`}>
                        <Button size="sm" variant="secondary">Editar</Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green">Usuarios</h2>
                <Link href="/users/create">
                    <Button>Nuevo Usuario</Button>
                </Link>
            </div>

            <Card padding="sm">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por nombre o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && router.get('/users', { search }, { preserveState: true })}
                        />
                    </div>
                    <Button onClick={() => router.get('/users', { search }, { preserveState: true })}>Buscar</Button>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={users.data}
                    keyExtractor={(u) => u.id}
                    emptyMessage="No hay usuarios registrados."
                />
                <Pagination
                    currentPage={users.meta.current_page}
                    lastPage={users.meta.last_page}
                    onPageChange={(page) => router.get('/users', { page, search }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
