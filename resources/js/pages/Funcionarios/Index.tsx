import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';

import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { ReactNode } from 'react';
import type { Funcionario, PaginatedData } from '@/types/generated/Tramite';

interface FuncionariosIndexProps {
    funcionarios: PaginatedData<Funcionario>;
    perPage?: number;
    filters?: { search?: string; estado?: string };
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </td>
            ))}
        </tr>
    );
}

export default function FuncionariosIndex({ funcionarios, perPage: initialPerPage = 10 }: FuncionariosIndexProps) {
    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Funcionario | null>(null);

    const perPage = funcionarios.meta.per_page ?? initialPerPage;

    const limpiar = () => {
        setSearch('');
    };

    const navigate = (overrides: Record<string, unknown>) => {
        setLoading(true);
        router.get('/funcionarios', { search, estado, ...overrides }, {
            preserveState: true,
            preserveScroll: true,
            only: ['funcionarios'],
            onSuccess: () => setLoading(false),
        });
    };

    useEffect(() => {
        setLoading(true);
        router.get('/funcionarios', { search, estado }, {
            preserveState: true,
            preserveScroll: true,
            only: ['funcionarios'],
            onSuccess: () => setLoading(false),
        });
    }, [search, estado]);

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/funcionarios/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

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

    const estadoBadge = (estado: string) => {
        const variants: Record<string, string> = {
            activo: 'success',
            inactivo: 'warning',
            baja: 'danger',
        };
        return <Badge variant={(variants[estado] ?? 'default') as any}>{estado}</Badge>;
    };

    const columns = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (f: Funcionario) => (
                <Link href={`/funcionarios/${f.id}`} className="text-patuju-green hover:underline font-medium">
                    {resaltar(`${f.nombre} ${f.apellidos}`)}
                </Link>
            ),
        },
        { key: 'email', header: 'Email', render: (f: Funcionario) => resaltar(f.email) },
        {
            key: 'cedula_identidad', header: 'CI',
            render: (f: Funcionario) => resaltar(f.cedula_identidad),
        },
        {
            key: 'area', header: 'Área',
            render: (f: Funcionario) => <Badge variant="info">{resaltar(f.area?.nombre)}</Badge>,
        },
        {
            key: 'estado', header: 'Estado',
            render: (f: Funcionario) => estadoBadge(f.estado),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            render: (f: Funcionario) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/funcionarios/${f.id}`}>
                        <Button size="sm" variant="secondary" className="gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <span className="hidden sm:inline">Ver</span>
                        </Button>
                    </Link>
                    <Link href={`/funcionarios/${f.id}/edit`}>
                        <Button size="sm" variant="secondary" className="gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            <span className="hidden sm:inline">Editar</span>
                        </Button>
                    </Link>
                    <Button size="sm" variant="danger" className="gap-1" onClick={() => setDeleteTarget(f)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Funcionarios</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Total: {funcionarios.meta.total ?? funcionarios.data.length} registros
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/funcionarios/create">
                        <Button>Nuevo Funcionario</Button>
                    </Link>
                </div>
            </div>

            <Card padding="sm">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 max-w-sm">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por nombre, apellidos o CI..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftElement={
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                            rightElement={search ? (
                                <button type="button" onClick={limpiar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            ) : undefined}
                        />
                    </div>
                    <div className="w-40">
                        <Select
                            label="Estado"
                            options={[
                                { value: '', label: 'Todos' },
                                { value: 'activo', label: 'Activo' },
                                { value: 'inactivo', label: 'Inactivo' },
                                { value: 'baja', label: 'Baja' },
                            ]}
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <Card>
                {loading && funcionarios.data.length === 0 ? (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                {[{ name: 'Nombre', align: 'text-left' }, { name: 'Email', align: 'text-left' }, { name: 'CI', align: 'text-left' }, { name: 'Área', align: 'text-left' }, { name: 'Estado', align: 'text-left' }, { name: 'Acciones', align: 'text-right' }].map((h) => (
                                    <th key={h.name} className={`px-4 py-3 text-xs font-medium uppercase text-gray-500 ${h.align}`}>{h.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                        </tbody>
                    </table>
                ) : (
                    <Table
                        columns={columns}
                        data={funcionarios.data}
                        keyExtractor={(f) => f.id}
                        emptyMessage="No hay funcionarios registrados."
                    />
                )}
                <div className="flex flex-col gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Mostrar</span>
                        <select
                            value={perPage}
                            onChange={(e) => navigate({ per_page: Number(e.target.value), page: 1 })}
                            className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:text-white"
                        >
                            {[5, 10, 25, 50, 100].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span>por página</span>
                        {funcionarios.meta.from !== null && funcionarios.meta.to !== null ? (
                            <span className="hidden sm:inline ml-2">
                                {funcionarios.meta.from}–{funcionarios.meta.to} de {funcionarios.meta.total}
                            </span>
                        ) : (
                            <span className="hidden sm:inline ml-2">{funcionarios.meta.total} registros</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => navigate({ page: funcionarios.meta.current_page - 1 })}
                            disabled={funcionarios.meta.current_page === 1}
                            className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: funcionarios.meta.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => navigate({ page })}
                                className={`min-w-[2rem] px-2 py-1 text-sm rounded border transition-colors ${
                                    page === funcionarios.meta.current_page
                                        ? 'bg-patuju-green text-white border-patuju-green font-medium'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => navigate({ page: funcionarios.meta.current_page + 1 })}
                            disabled={funcionarios.meta.current_page === funcionarios.meta.last_page}
                            className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-patuju-cream dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </Card>

            <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        ¿Estás seguro de eliminar a <strong>{deleteTarget?.nombre} {deleteTarget?.apellidos}</strong>?
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
