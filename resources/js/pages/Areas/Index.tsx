import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import type { ReactNode } from 'react';
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

const ACENTOS: Record<string, string> = {
    a: 'aáàäâã', e: 'eéèëê', i: 'iíìïî',
    o: 'oóòöôõ', u: 'uúùüû', n: 'nñ',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const aPattern = (s: string) => {
    let result = '';
    for (const c of s.toLowerCase()) {
        const vars = ACENTOS[c];
        result += vars ? `[${vars}]` : c;
    }
    return result;
};

export default function AreasIndex({ areas }: AreasIndexProps) {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setLoading(true);
            router.get('/areas', { search }, {
                preserveState: true,
                preserveScroll: true,
                only: ['areas'],
                onSuccess: () => setLoading(false),
            });
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const resaltar = (texto: string | null | undefined): ReactNode => {
        if (!texto || !search) return texto ?? '—';

        const palabras = search.split(/[/\s]+/).filter(Boolean);
        if (palabras.length === 0) return texto;

        const pattern = palabras.map((p) => aPattern(p)).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');

        return texto.split(regex).map((parte, i) =>
            i % 2 === 1
                ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">{parte}</mark>
                : parte,
        );
    };

    const columns = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (a: AreaRow) => (
                <Link href={`/areas/${a.id}`} className="text-patuju-green hover:underline font-medium">
                    {resaltar(a.nombre)}
                </Link>
            ),
        },
        {
            key: 'sigla',
            header: 'Sigla',
            render: (a: AreaRow) => (
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">{resaltar(a.sigla)}</span>
            ),
        },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (a: AreaRow) => resaltar(a.descripcion),
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
                {loading && areas.data.length === 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {[{ name: 'Nombre', align: 'text-left' }, { name: 'Sigla', align: 'text-left' }, { name: 'Descripción', align: 'text-left' }, { name: 'Estado', align: 'text-left' }, { name: 'Puestos', align: 'text-left' }, { name: 'Acciones', align: 'text-right' }].map((h) => (
                                    <th key={h.name} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${h.align}`}>{h.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <Table
                        columns={columns}
                        data={areas.data}
                        keyExtractor={(a) => a.id}
                        emptyMessage="No hay áreas registradas."
                    />
                )}
                <Pagination
                    currentPage={areas.meta.current_page}
                    lastPage={areas.meta.last_page}
                    onPageChange={(page) => router.get('/areas', { page, search }, { preserveState: true, preserveScroll: true, only: ['areas'] })}
                />
            </Card>
        </div>
    );
}
