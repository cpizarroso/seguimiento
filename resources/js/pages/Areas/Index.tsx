import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import type { PaginatedData } from '@/types/generated/Tramite';

interface AreaRow {
    id: number;
    nombre: string;
    descripcion: string | null;
    sigla: string;
    estado: boolean;
    puestos_count: number | null;
}

interface AreasIndexProps {
    areas: PaginatedData<AreaRow>;
}

export default function AreasIndex({ areas }: AreasIndexProps) {
    const [search, setSearch] = useState('');

    const columns = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (a: AreaRow) => (
                <Link href={`/areas/${a.id}`} className="text-patuju-green hover:underline font-medium">
                    {a.nombre}
                </Link>
            ),
        },
        {
            key: 'sigla',
            header: 'Sigla',
            render: (a: AreaRow) => (
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{a.sigla}</span>
            ),
        },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (a: AreaRow) => a.descripcion ?? '—',
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (a: AreaRow) => a.estado
                ? <Badge variant="success">Activo</Badge>
                : <Badge variant="danger">Inactivo</Badge>,
        },
        {
            key: 'puestos_count',
            header: 'Puestos',
            render: (a: AreaRow) => a.puestos_count?.toString() ?? '0',
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (a: AreaRow) => (
                <div className="flex gap-2">
                    <Link href={`/areas/${a.id}/edit`}>
                        <Button size="sm" variant="secondary">Editar</Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green">Áreas</h2>
                <Link href="/areas/create">
                    <Button>Nueva Área</Button>
                </Link>
            </div>

            <Card padding="sm">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && router.get('/areas', { search }, { preserveState: true })}
                        />
                    </div>
                    <Button onClick={() => router.get('/areas', { search }, { preserveState: true })}>Buscar</Button>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={areas.data}
                    keyExtractor={(a) => a.id}
                    emptyMessage="No hay áreas registradas."
                />
                <Pagination
                    currentPage={areas.meta.current_page}
                    lastPage={areas.meta.last_page}
                    onPageChange={(page) => router.get('/areas', { page, search }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
