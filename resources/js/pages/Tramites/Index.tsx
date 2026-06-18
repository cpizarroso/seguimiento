import { Link, router, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import type { Tramite, PaginatedData } from '@/types/generated/Tramite';
import { useState } from 'react';

interface TramitesIndexProps {
    tramites: PaginatedData<Tramite>;
}

const vistas = [
    { value: 'bandeja', label: 'Bandeja' },
    { value: 'por_recepcionar', label: 'Por Recepcionar' },
    { value: 'derivados', label: 'Derivados' },
    { value: 'busqueda', label: 'Búsqueda' },
];

const estadoColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    iniciado: 'info',
    proceso: 'warning',
    observado: 'default',
    finalizado: 'success',
};

const estadoLabels: Record<string, string> = {
    iniciado: 'Iniciado',
    proceso: 'Proceso',
    observado: 'Observado',
    finalizado: 'Finalizado',
};

export default function TramitesIndex({ tramites }: TramitesIndexProps) {
    const { url, props } = usePage();
    const role = (props.auth?.user as { role?: string } | null)?.role ?? 'user';
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [vista, setVista] = useState(params.get('vista') ?? 'bandeja');

    const buscar = (nuevaVista?: string) => {
        router.get('/tramites', {
            search,
            vista: nuevaVista ?? vista,
        }, { preserveState: true, preserveScroll: true });
    };

    const limpiar = () => {
        setSearch('');
        router.get('/tramites', { vista }, { preserveState: true, preserveScroll: true });
    };

    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const resaltar = (texto: string | null | undefined): React.ReactNode => {
        if (!texto || !search) return texto ?? '—';

        const marcar = (t: string, s: string) => {
            const regex = new RegExp(`(${escape(s)})`, 'gi');
            return t.split(regex).map((parte, i) =>
                parte.toLowerCase() === s.toLowerCase()
                    ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">{parte}</mark>
                    : parte,
            );
        };

        const exact = marcar(texto, search);
        if (exact.some(p => typeof p !== 'string')) return exact;

        if (search.includes('/')) {
            const parts = search.split('/').filter(Boolean);
            let result: (string | React.ReactNode)[] = [texto];
            for (const part of parts) {
                const next: (string | React.ReactNode)[] = [];
                for (const node of result) {
                    if (typeof node === 'string') {
                        next.push(...marcar(node, part));
                    } else {
                        next.push(node);
                    }
                }
                result = next;
            }
            return result;
        }

        return texto;
    };

    const columns = [
        {
            key: 'numero_tramite',
            header: 'N° Trámite',
            render: (t: Tramite) => (
                <Link href={`/tramites/${t.id}`} className="text-patuju-green hover:underline font-medium">
                    {resaltar(`${t.numero_formateado}/${t.year}`)}
                </Link>
            ),
        },
        { key: 'fecha', header: 'Gestión', render: (t: Tramite) => resaltar(t.fecha) },
        { key: 'area', header: 'Área', render: (t: Tramite) => resaltar(t.area?.sigla ?? t.area?.nombre) },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (t: Tramite) => (
                <span className="line-clamp-2 max-w-xs">{resaltar(t.descripcion)}</span>
            ),
        },
        {
            key: 'asignado',
            header: 'Derivado a',
            render: (t: Tramite) => resaltar(t.asignado?.name),
        },
        { key: 'numero_diamante', header: 'Diamante', render: (t: Tramite) => resaltar(t.numero_diamante) },
        { key: 'ultima_respuesta', header: 'Respuesta', render: (t: Tramite) => resaltar(t.ultima_respuesta) },
        {
            key: 'estado',
            header: 'Estado',
            render: (t: Tramite) => (
                <Badge variant={estadoColors[t.estado] ?? 'default'}>
                    {estadoLabels[t.estado] ?? t.estado}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Trámites</h2>
                {role === 'admin' && (
                    <Link href="/tramites/create">
                        <Button>Nuevo Trámite</Button>
                    </Link>
                )}
            </div>

            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                {vistas.map((v) => (
                    <button
                        key={v.value}
                        onClick={() => { setVista(v.value); buscar(v.value); }}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                            vista === v.value
                                ? 'border-patuju-green text-patuju-green'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            <Card padding="sm">
                <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
                    <div className="flex items-center w-full border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-patuju-green dark:focus-within:border-patuju-green transition-all bg-white dark:bg-gray-700">
                        <span className="pl-4 text-gray-400 dark:text-gray-500 flex-shrink-0">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && buscar()}
                            placeholder="Buscar trámites..."
                            className="w-full px-3 py-2.5 text-sm bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        {search && (
                            <button
                                onClick={limpiar}
                                className="flex-shrink-0 px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg leading-none"
                                title="Limpiar búsqueda"
                            >
                                ✕
                            </button>
                        )}
                        <button
                            onClick={buscar}
                            className="flex-shrink-0 px-5 py-2 mr-1.5 text-sm font-medium text-white bg-patuju-green hover:bg-patuju-green/90 rounded-full transition-colors"
                        >
                            Buscar
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    data={tramites.data}
                    keyExtractor={(t) => t.id}
                    emptyMessage="No hay trámites registrados."
                />
                <Pagination
                    currentPage={tramites.meta.current_page}
                    lastPage={tramites.meta.last_page}
                    onPageChange={(page) => router.get('/tramites', { page, search, vista }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
