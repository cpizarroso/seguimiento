import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { TramiteForm } from '@/components/features/tramites/TramiteForm';
import { usePermissions } from '@/hooks/usePermissions';
import type { Tramite, PaginatedData, Area } from '@/types/generated/Tramite';
import { useEffect, useRef, useState } from 'react';

interface TramitesIndexProps {
    tramites: PaginatedData<Tramite>;
    areas: { data: Area[] };
}

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

export default function TramitesIndex({ tramites, areas }: TramitesIndexProps) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const { can } = usePermissions();
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const [search, setSearch] = useState(params.get('search') ?? '');
    const [soloHoy, setSoloHoy] = useState(params.get('hoy') === '1');
    const [areaId, setAreaId] = useState(params.get('area_id') ?? '');
    const [createOpen, setCreateOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const miAreaId = auth.user?.area_id != null ? String(auth.user.area_id) : '';
    const miAreaActiva = areaId !== '' && miAreaId !== '' && areaId === miAreaId;

    const createForm = useForm({
        descripcion: '',
        numero_diamante: '',
        area_id: '',
        urgente: false as boolean,
    });

    useEffect(() => {
        if (!createOpen) {
            searchInputRef.current?.focus();
        }
    }, [createOpen]);

    useEffect(() => {
        const paramsEnUrl = new URLSearchParams(url.split('?')[1] ?? '');
        if (
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(max-width: 639px)').matches &&
            !paramsEnUrl.has('per_page') &&
            tramites.meta.per_page !== 5
        ) {
            router.get('/tramites', {
                search: search || undefined,
                hoy: soloHoy ? '1' : undefined,
                area_id: areaId || undefined,
                per_page: 5,
                page: 1,
            }, { preserveState: true });
        }
    }, []);

    const buscar = () => {
        router.get('/tramites', {
            search: search || undefined,
            hoy: soloHoy ? '1' : undefined,
            area_id: areaId || undefined,
            page: undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const toggleHoy = () => {
        const value = !soloHoy;
        setSoloHoy(value);
        router.get('/tramites', {
            search: search || undefined,
            hoy: value ? '1' : undefined,
            area_id: areaId || undefined,
            page: 1,
        }, { preserveState: true, preserveScroll: true });
    };

    const filtrarArea = (value: string) => {
        setAreaId(value);
        router.get('/tramites', {
            search: search || undefined,
            hoy: soloHoy ? '1' : undefined,
            area_id: value || undefined,
            page: 1,
        }, { preserveState: true, preserveScroll: true });
    };

    const toggleMiArea = () => {
        filtrarArea(miAreaActiva ? '' : miAreaId);
    };

    const limpiar = () => {
        setSearch('');
        setSoloHoy(false);
        setAreaId('');
        router.get('/tramites', { page: 1 }, { preserveState: true, preserveScroll: true });
        searchInputRef.current?.focus();
    };

    const exportar = () => {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (soloHoy) query.set('hoy', '1');
        if (areaId) query.set('area_id', areaId);
        window.location.href = `/tramites/exportar?${query.toString()}`;
    };

    const ACENTOS: Record<string, string> = {
        a: 'aáàäâã', e: 'eéèëê', i: 'iíìïî',
        o: 'oóòöôõ', u: 'uúùüû', n: 'nñ',
    };

    const aPattern = (s: string) => {
        let result = '';
        for (const c of s.toLowerCase()) {
            const vars = ACENTOS[c];
            result += vars ? `[${vars}]` : c;
        }
        return result;
    };

    const resaltar = (texto: string | null | undefined): React.ReactNode => {
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
            key: 'numero_tramite',
            header: 'NRO',
            cellClassName: 'text-center',
            render: (t: Tramite) => (
                <span className="whitespace-nowrap">
                    <Link href={`/tramites/${t.id}?search=${encodeURIComponent(search)}`} className="text-patuju-green hover:underline text-2xl font-bold">
                        {resaltar(String(t.numero_tramite))}
                    </Link>
                </span>
            ),
        },
        {
            key: 'urgente',
            header: 'Urgente',
            cellClassName: 'text-center',
            render: (t: Tramite) => (
                <span className="flex items-center justify-center">
                    {t.urgente
                        ? <Badge variant="danger">Urgente</Badge>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                </span>
            ),
        },
        { key: 'created_at', header: 'Fecha creación', render: (t: Tramite) => t.created_at ?? '—' },
        { key: 'numero_diamante', header: 'N° Diamante', render: (t: Tramite) => resaltar(t.numero_diamante) },
        { key: 'area', header: 'Área', render: (t: Tramite) => resaltar(t.area?.sigla ?? t.area?.nombre) },
        {
            key: 'descripcion',
            header: 'Descripción',
            render: (t: Tramite) => (
                <span className="line-clamp-2 max-w-xs">{resaltar(t.descripcion)}</span>
            ),
        },
        {
            key: 'ultima_derivacion',
            header: 'Última derivación',
            render: (t: Tramite) => {
                const derivacion = t.derivaciones?.[0];

                if (!derivacion) {
                    return <span className="text-xs text-gray-400 dark:text-gray-500">Sin derivaciones</span>;
                }

                return (
                    <div className="max-w-[240px]">
                        <div className="text-xs font-medium text-patuju-green dark:text-patuju-green">
                            N° {derivacion.numero_derivacion} · {derivacion.fecha_derivacion}
                        </div>
                        <div className="line-clamp-2 text-sm">{resaltar(derivacion.glosa_derivacion)}</div>
                        {t.asignado?.name && (
                            <div className="truncate text-xs text-gray-500 dark:text-gray-400">{t.asignado.name}</div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'dias_transcurridos',
            header: 'Días',
            cellClassName: 'text-center',
            render: (t: Tramite) => {
                const d = t.dias_transcurridos ?? 0;
                const color = d >= 5 ? 'bg-patuju-red/10 text-patuju-red border-patuju-red'
                    : d >= 4 ? 'bg-patuju-orange/10 text-patuju-orange border-patuju-orange'
                    : d >= 3 ? 'bg-patuju-yellow/10 text-patuju-yellow border-patuju-yellow'
                    : 'text-gray-500';
                return (
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${color}`}>
                        {d}
                    </span>
                );
            },
        },
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
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={exportar}>Exportar Excel</Button>
                    {can('tramites', 'creacion') && (
                        <Button onClick={() => setCreateOpen(true)}>Nuevo Trámite</Button>
                    )}
                </div>
            </div>

            <Card padding="sm">
                <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto">
                    <div className="flex items-center w-full border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-patuju-green dark:focus-within:border-patuju-green transition-all bg-white dark:bg-gray-700">
                        <span className="pl-4 text-gray-400 dark:text-gray-500 flex-shrink-0">🔍</span>
                        <input
                            ref={searchInputRef}
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
                            onClick={() => buscar()}
                            className="flex-shrink-0 px-5 py-2 mr-1.5 text-sm font-medium text-white bg-patuju-green hover:bg-patuju-green/90 rounded-full transition-colors"
                        >
                            Buscar
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            Área
                            <select
                                value={areaId}
                                onChange={(e) => filtrarArea(e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-patuju-green"
                            >
                                <option value="">Todas</option>
                                {(areas?.data ?? []).map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.sigla} · {a.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none" title={miAreaId ? undefined : 'Tu usuario no tiene área asignada'}>
                            <input
                                type="checkbox"
                                checked={miAreaActiva}
                                onChange={toggleMiArea}
                                disabled={miAreaId === ''}
                                className="h-4 w-4 rounded accent-patuju-green disabled:opacity-40"
                            />
                            Mi área
                        </label>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={soloHoy}
                            onChange={toggleHoy}
                            className="h-4 w-4 rounded accent-patuju-green"
                        />
                        Solo hoy
                    </label>
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
                    from={tramites.meta.from}
                    to={tramites.meta.to}
                    total={tramites.meta.total}
                    perPage={tramites.meta.per_page}
                    label="trámites"
                    onPageChange={(page) => router.get('/tramites', { page, search: search || undefined, hoy: soloHoy ? '1' : undefined, area_id: areaId || undefined }, { preserveState: true })}
                    onPerPageChange={(perPage) => router.get('/tramites', { per_page: perPage, page: 1, search: search || undefined, hoy: soloHoy ? '1' : undefined, area_id: areaId || undefined }, { preserveState: true })}
                />
            </Card>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Trámite">
                <TramiteForm
                    form={createForm}
                    areas={areas?.data ?? []}
                    submitUrl="/tramites"
                    onSuccess={() => {
                        setCreateOpen(false);
                        createForm.reset();
                    }}
                    onCancel={() => setCreateOpen(false)}
                />
            </Modal>
        </div>
    );
}
