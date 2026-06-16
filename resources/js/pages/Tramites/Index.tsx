import { Link, router, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import type { Tramite, PaginatedData, Puesto } from '@/types/generated/Tramite';
import { useState } from 'react';

interface TramitesIndexProps {
    tramites: PaginatedData<Tramite>;
    puestos: Puesto[];
}

const vistas = [
    { value: 'bandeja', label: 'Bandeja' },
    { value: 'por_recepcionar', label: 'Por Recepcionar' },
    { value: 'recepcionados', label: 'Recepcionados' },
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

export default function TramitesIndex({ tramites, puestos }: TramitesIndexProps) {
    const { url, props } = usePage();
    const role = (props.auth?.user as { role?: string } | null)?.role ?? 'user';
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [estadoFiltro, setEstadoFiltro] = useState(params.get('estado') ?? '');
    const [vista, setVista] = useState(params.get('vista') ?? 'bandeja');

    const buscar = (nuevaVista?: string) => {
        router.get('/tramites', {
            search,
            estado: estadoFiltro,
            vista: nuevaVista ?? vista,
        }, { preserveState: true, preserveScroll: true });
    };

    const columns = [
        {
            key: 'numero_tramite',
            header: 'N° Trámite',
            render: (t: Tramite) => (
                <Link href={`/tramites/${t.id}`} className="text-patuju-green hover:underline font-medium">
                    {t.numero_formateado}/{t.year}
                </Link>
            ),
        },
        { key: 'fecha', header: 'Fecha', render: (t: Tramite) => t.fecha ?? '—' },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (t: Tramite) => (
                <span className="line-clamp-2 max-w-xs">{t.descripcion}</span>
            ),
        },
        {
            key: 'asignado',
            header: 'Derivado a',
            render: (t: Tramite) => t.asignado?.name ?? t.creador?.name ?? '—',
        },
        { key: 'numero_diamante', header: 'Diamante', render: (t: Tramite) => t.numero_diamante ?? '—' },
        { key: 'ultima_respuesta', header: 'Respuesta', render: (t: Tramite) => t.ultima_respuesta ?? '—' },
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
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <Input
                            label="Buscar"
                            placeholder="Buscar por cualquier campo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && buscar()}
                        />
                    </div>
                    <Select
                        label="Estado"
                        options={[
                            { value: '', label: 'Todos' },
                            ...Object.entries(estadoLabels).map(([value, label]) => ({ value, label })),
                        ]}
                        value={estadoFiltro}
                        onChange={(e) => setEstadoFiltro(e.target.value)}
                    />
                    <Button onClick={buscar}>Buscar</Button>
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
                    onPageChange={(page) => router.get('/tramites', { page, search, estado: estadoFiltro, vista }, { preserveState: true })}
                />
            </Card>
        </div>
    );
}
