import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import type { Funcionario, PaginatedData } from '@/types/generated/Tramite';

interface FuncionariosIndexProps {
    funcionarios: PaginatedData<Funcionario>;
}

export default function FuncionariosIndex({ funcionarios }: FuncionariosIndexProps) {
    const [search, setSearch] = useState('');

    const columns = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (f: Funcionario) => (
                <Link href={`/funcionarios/${f.id}/edit`} className="text-patuju-green hover:underline font-medium">
                    {f.nombre} {f.apellidos}
                </Link>
            ),
        },
        { key: 'email', header: 'Email', render: (f: Funcionario) => f.email ?? '—' },
        {
            key: 'cedula_identidad',
            header: 'CI',
            render: (f: Funcionario) => f.cedula_identidad ?? '—',
        },
        {
            key: 'area',
            header: 'Área',
            render: (f: Funcionario) => (
                <Badge variant="info">{f.area?.nombre ?? '—'}</Badge>
            ),
        },
        {
            key: 'tipo_funcionario',
            header: 'Tipo',
            render: (f: Funcionario) => (
                <Badge variant={f.tipo_funcionario === 'item' ? 'success' : 'default'}>
                    {f.tipo_funcionario}
                </Badge>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            render: (f: Funcionario) => (
                <div className="flex gap-2">
                    <Link href={`/funcionarios/${f.id}/edit`}>
                        <Button size="sm" variant="secondary">Editar</Button>
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Funcionarios</h2>
                <Link href="/funcionarios/create">
                    <Button>Nuevo Funcionario</Button>
                </Link>
            </div>

            <Card padding="sm">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por nombre, apellidos o CI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && router.get('/funcionarios', { search }, { preserveState: true })}
                        />
                    </div>
                    <Button onClick={() => router.get('/funcionarios', { search }, { preserveState: true })}>Buscar</Button>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={funcionarios.data}
                    keyExtractor={(f) => f.id}
                    emptyMessage="No hay funcionarios registrados."
                />
                <Pagination
                    currentPage={funcionarios.meta.current_page}
                    lastPage={funcionarios.meta.last_page}
                    onPageChange={(page) => router.get('/funcionarios', { page, search }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
