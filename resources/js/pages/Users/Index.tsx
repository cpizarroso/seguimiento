import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import type { PaginatedData } from '@/types/generated/Tramite';

interface UserRow {
    id: number;
    name: string;
    email: string;
    nro_telefono: string | null;
    profesion: string | null;
    cargo: string | null;
    role: string;
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
                <Link href={`/users/${u.id}/edit`} className="text-patuju-green hover:underline font-medium">
                    {u.name}
                </Link>
            ),
        },
        { key: 'email', header: 'Email' },
        { key: 'nro_telefono', header: 'Teléfono', render: (u: UserRow) => u.nro_telefono ?? '—' },
        { key: 'profesion', header: 'Profesión', render: (u: UserRow) => u.profesion ?? '—' },
        { key: 'cargo', header: 'Cargo', render: (u: UserRow) => u.cargo ?? '—' },
        {
            key: 'role',
            header: 'Rol',
            render: (u: UserRow) => (
                <Badge variant={u.role === 'admin' ? 'success' : 'info'}>
                    {u.role === 'admin' ? 'Administrador' : 'Usuario'}
                </Badge>
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
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                            if (confirm('¿Eliminar este usuario?')) {
                                router.delete(`/users/${u.id}`);
                            }
                        }}
                    >
                        Eliminar
                    </Button>
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
