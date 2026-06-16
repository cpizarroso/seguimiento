import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import type { Puesto, PaginatedData } from '@/types/generated/Tramite';

interface PuestosIndexProps {
    puestos: PaginatedData<Puesto>;
}

export default function PuestosIndex({ puestos }: PuestosIndexProps) {
    const [search, setSearch] = useState('');

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
            render: (p: Puesto) => p.funcionarios_count?.toString() ?? '0',
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (p: Puesto) => (
                <div className="flex gap-2">
                    <Link href={`/puestos/${p.id}/edit`}>
                        <Button size="sm" variant="secondary">Editar</Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Puestos de Trabajo</h2>
                <Link href="/puestos/create">
                    <Button>Nuevo Puesto</Button>
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
                            onKeyDown={(e) => e.key === 'Enter' && router.get('/puestos', { search }, { preserveState: true })}
                        />
                    </div>
                    <Button onClick={() => router.get('/puestos', { search }, { preserveState: true })}>Buscar</Button>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={puestos.data}
                    keyExtractor={(p) => p.id}
                    emptyMessage="No hay puestos registrados."
                />
                <Pagination
                    currentPage={puestos.meta.current_page}
                    lastPage={puestos.meta.last_page}
                    onPageChange={(page) => router.get('/puestos', { page, search }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
