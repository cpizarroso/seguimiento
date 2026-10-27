import { Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RangoCalendario } from '@/components/features/reporte/RangoCalendario';
import { Table, type SortDirection } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { TramiteForm } from '@/components/features/tramites/TramiteForm';
import { DerivarModal } from '@/components/features/derivaciones/DerivarModal';
import { usePermissions } from '@/hooks/usePermissions';
import type { Tramite, PaginatedData, Area } from '@/types/generated/Tramite';
import type { DestinatarioDerivacion } from '@/types/derivaciones';
import type { SecuenciasPorArea } from '@/types/tramites';

interface TramitesIndexProps {
    tramites: PaginatedData<Tramite>;
    areas: { data: Area[] };
    areasCreacion?: { data: (Area & { predeterminada?: boolean })[] };
    secuencias?: SecuenciasPorArea;
    destinatarios?: DestinatarioDerivacion[];
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

const DEFAULT_SORT = 'created_at';
const DEFAULT_DIRECTION: SortDirection = 'desc';

type FiltroRecepcion = 'todos' | 'por_recepcionar' | 'recepcionados';

const RECEPCION_OPCIONES: { value: FiltroRecepcion; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'por_recepcionar', label: 'Por recepcionar' },
    { value: 'recepcionados', label: 'Recepcionados' },
];

function fechaISO(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function normalizarRango(desde: string, hasta: string): [string, string] {
    if (desde && hasta && desde > hasta) {
        return [hasta, desde];
    }

    return [desde, hasta];
}

const SORTABLE_KEYS = [
    'numero_tramite',
    'urgente',
    'created_at',
    'numero_diamante',
    'area',
    'descripcion',
    'ultima_derivacion',
    'dias_transcurridos',
    'estado',
];

export default function TramitesIndex({ tramites, areas, areasCreacion, secuencias, destinatarios }: TramitesIndexProps) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const { can } = usePermissions();
    const usuarioId = auth.user?.id;
    const puedeGestionar = can('tramites', 'edicion');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [derivarOpen, setDerivarOpen] = useState(false);
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const hoyISO = fechaISO(new Date());
    const esRangoHoy = params.get('hoy') === '1';
    const [numeroTramite, setNumeroTramite] = useState(params.get('numero_tramite') ?? '');
    const [numeroDiamante, setNumeroDiamante] = useState(params.get('numero_diamante') ?? '');
    const [descripcion, setDescripcion] = useState(params.get('descripcion') ?? '');
    const [fechaDesde, setFechaDesde] = useState(
        params.get('fecha_desde') ?? (esRangoHoy ? hoyISO : ''),
    );
    const [fechaHasta, setFechaHasta] = useState(
        params.get('fecha_hasta') ?? (esRangoHoy ? hoyISO : ''),
    );
    const [areaId, setAreaId] = useState(params.get('area_id') ?? '');
    const recepcionParam = params.get('recepcion');
    const [recepcion, setRecepcion] = useState<FiltroRecepcion>(
        recepcionParam === 'por_recepcionar' || recepcionParam === 'recepcionados'
            ? recepcionParam
            : 'todos',
    );
    const sortParam = params.get('sort');
    const sortValido = sortParam !== null && SORTABLE_KEYS.includes(sortParam);
    const [sortBy, setSortBy] = useState(sortValido ? (sortParam as string) : DEFAULT_SORT);
    const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
        const directionParam = params.get('direction');

        if (directionParam === 'asc' || directionParam === 'desc') {
            return directionParam;
        }

        return sortValido ? 'asc' : DEFAULT_DIRECTION;
    });
    const [createOpen, setCreateOpen] = useState(false);

    const miAreaId = auth.user?.area_id != null ? String(auth.user.area_id) : '';
    const miAreaActiva = areaId !== '' && miAreaId !== '' && areaId === miAreaId;
    const aplicadoDesde = params.get('fecha_desde') ?? (esRangoHoy ? hoyISO : '');
    const aplicadoHasta = params.get('fecha_hasta') ?? (esRangoHoy ? hoyISO : '');
    const esHoy = aplicadoDesde === hoyISO && aplicadoHasta === hoyISO;

    const esDerivable = (tramite: Tramite): boolean => {
        if (!usuarioId || !puedeGestionar || tramite.estado === 'finalizado' || tramite.asignado?.id !== usuarioId) {
            return false;
        }

        const ultima = (tramite.derivaciones ?? []).reduce<Tramite['derivaciones'][number] | null>((actual, derivacion) => {
            if (!actual || derivacion.numero_derivacion > actual.numero_derivacion) {
                return derivacion;
            }

            return actual;
        }, null);

        return ultima?.estado === 'recepcionado' && ultima.derivado_a?.id === usuarioId;
    };

    useEffect(() => {
        setSelectedIds((previos) => previos.filter((id) => {
            const tramite = tramites.data.find((item) => item.id === id);

            return tramite ? esDerivable(tramite) : false;
        }));
    }, [tramites.data, puedeGestionar, usuarioId]);

    useEffect(() => {
        setSelectedIds([]);
    }, [url]);

    const areaOptions = (areas?.data ?? []).map((area) => ({
        value: String(area.id),
        label: `${area.codigo} · ${area.nombre}`,
    }));

    const areasCreacionData = areasCreacion?.data ?? [];
    const areaPredeterminada = areasCreacionData.find((area) => area.predeterminada) ?? areasCreacionData[0];

    const createForm = useForm({
        descripcion: '',
        numero_diamante: '',
        area_id: areaPredeterminada ? String(areaPredeterminada.id) : '',
        urgente: false as boolean,
    });

    const abrirCreacion = () => {
        createForm.setData('area_id', areaPredeterminada ? String(areaPredeterminada.id) : '');
        createForm.clearErrors();
        router.reload({ only: ['secuencias'] });
        setCreateOpen(true);
    };

    const filtrosAplicados = (overrides: Record<string, string | number | undefined> = {}) => {
        const filtros: Record<string, string | number | undefined> = {};

        params.forEach((value, key) => {
            if (key !== 'page' && key !== 'per_page') {
                filtros[key] = value;
            }
        });

        return {
            ...filtros,
            area_id: areaId || undefined,
            recepcion: recepcion === 'todos' ? undefined : recepcion,
            sort: sortBy || undefined,
            direction: sortBy ? sortDirection : undefined,
            ...overrides,
        };
    };

    useEffect(() => {
        const paramsEnUrl = new URLSearchParams(url.split('?')[1] ?? '');
        if (
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(max-width: 639px)').matches &&
            !paramsEnUrl.has('per_page') &&
            tramites.meta.per_page !== 5
        ) {
            router.get('/tramites', filtrosAplicados({
                per_page: 5,
                page: 1,
            }), { preserveState: true });
        }
    }, []);

    const buscar = () => {
        const [desde, hasta] = normalizarRango(fechaDesde, fechaHasta);
        setFechaDesde(desde);
        setFechaHasta(hasta);

        router.get('/tramites', filtrosAplicados({
            numero_tramite: numeroTramite.trim() || undefined,
            numero_diamante: numeroDiamante.trim() || undefined,
            descripcion: descripcion.trim() || undefined,
            fecha_desde: desde || undefined,
            fecha_hasta: hasta || undefined,
            search: undefined,
            hoy: undefined,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const aplicarRango = (desde: string, hasta: string) => {
        const [inicio, fin] = normalizarRango(desde, hasta);
        setFechaDesde(inicio);
        setFechaHasta(fin);

        router.get('/tramites', filtrosAplicados({
            fecha_desde: inicio || undefined,
            fecha_hasta: fin || undefined,
            hoy: undefined,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const toggleHoy = () => {
        const value = esHoy ? '' : hoyISO;
        setFechaDesde(value);
        setFechaHasta(value);

        router.get('/tramites', filtrosAplicados({
            fecha_desde: value || undefined,
            fecha_hasta: value || undefined,
            hoy: undefined,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const filtrarArea = (value: string) => {
        setAreaId(value);
        router.get('/tramites', filtrosAplicados({
            area_id: value || undefined,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const toggleMiArea = () => {
        filtrarArea(miAreaActiva ? '' : miAreaId);
    };

    const filtrarRecepcion = (value: FiltroRecepcion) => {
        setRecepcion(value);
        router.get('/tramites', filtrosAplicados({
            recepcion: value === 'todos' ? undefined : value,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const limpiarFiltros = () => {
        setNumeroTramite('');
        setNumeroDiamante('');
        setDescripcion('');
        setFechaDesde('');
        setFechaHasta('');
        setAreaId('');
        setRecepcion('todos');
        router.get('/tramites', {
            sort: sortBy || undefined,
            direction: sortBy ? sortDirection : undefined,
            page: 1,
        }, { preserveState: true, preserveScroll: true });
    };

    const ordenar = (key: string) => {
        const direction: SortDirection = sortBy === key && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(key);
        setSortDirection(direction);
        router.get('/tramites', filtrosAplicados({
            sort: key,
            direction,
            page: 1,
        }), { preserveState: true, preserveScroll: true });
    };

    const exportar = () => {
        const query = new URLSearchParams(url.split('?')[1] ?? '');
        query.delete('page');
        query.delete('per_page');

        window.location.href = `/tramites/exportar${query.toString() ? `?${query.toString()}` : ''}`;
    };

    const ACENTOS: Record<string, string> = {
        a: 'aáàäâã', e: 'eéèëê', i: 'iíìïî',
        o: 'oóòöôõ', u: 'uúùüû', n: 'nñ',
    };

    const aPattern = (s: string) => {
        let result = '';
        for (const c of s.toLowerCase()) {
            const vars = ACENTOS[c];
            if (vars) {
                result += `[${vars}]`;
            } else if (/[.*+?^${}()|[\]\\]/.test(c)) {
                result += `\\${c}`;
            } else {
                result += c;
            }
        }
        return result;
    };

    const resaltar = (texto: string | null | undefined, termino: string): ReactNode => {
        if (!texto || !termino.trim()) return texto ?? '—';

        const palabras = termino.split(/[/\s]+/).filter(Boolean);
        if (palabras.length === 0) return texto;

        const pattern = palabras.map((p) => aPattern(p)).join('|');
        if (!pattern) return texto;

        const regex = new RegExp(`(${pattern})`, 'gi');

        return texto.split(regex).map((parte, i) =>
            i % 2 === 1
                ? <mark key={i} className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700">{parte}</mark>
                : parte,
        );
    };

    const queryActual = url.split('?')[1] ?? '';

    const columns = [
        {
            key: 'numero_tramite',
            header: 'NRO',
            sortable: true,
            cellClassName: 'text-center',
            render: (t: Tramite) => (
                <span className="whitespace-nowrap">
                    <Link href={`/tramites/${t.id}${queryActual ? `?${queryActual}` : ''}`} className="text-sm font-semibold text-patuju-green hover:underline">
                        {resaltar(String(t.numero_tramite), numeroTramite)}
                    </Link>
                </span>
            ),
        },
        {
            key: 'urgente',
            header: 'Urgente',
            sortable: true,
            cellClassName: 'text-center',
            render: (t: Tramite) => (
                <span className="flex items-center justify-center">
                    {t.urgente
                        ? <Badge variant="danger">Urgente</Badge>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                </span>
            ),
        },
        { key: 'created_at', header: 'Fecha creación', sortable: true, render: (t: Tramite) => t.created_at ?? '—' },
        { key: 'numero_diamante', header: 'N° Diamante', sortable: true, render: (t: Tramite) => resaltar(t.numero_diamante, numeroDiamante) },
        {
            key: 'area',
            header: 'Área',
            sortable: true,
            render: (t: Tramite) => {
                if (!t.area) {
                    return <span className="text-xs text-gray-400 dark:text-gray-500">Sin área</span>;
                }

                return (
                    <div className="max-w-[220px]">
                        <div className="truncate text-sm">{resaltar(t.area.nombre, '')}</div>
                        <div className="text-xs font-medium text-excel-muted dark:text-gray-400">
                            {t.area.codigo}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'descripcion',
            header: 'Descripción',
            sortable: true,
            render: (t: Tramite) => (
                <span className="line-clamp-2 max-w-xs">{resaltar(t.descripcion, descripcion)}</span>
            ),
        },
        {
            key: 'ultima_derivacion',
            header: 'Última derivación',
            sortable: true,
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
                        <div className="line-clamp-2 text-sm">{resaltar(derivacion.glosa_derivacion, '')}</div>
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
            sortable: true,
            cellClassName: 'text-center',
            render: (t: Tramite) => {
                const d = t.dias_transcurridos ?? 0;
                const color = d >= 5 ? 'bg-patuju-red/10 text-patuju-red border-patuju-red'
                    : d >= 4 ? 'bg-patuju-orange/10 text-patuju-orange border-patuju-orange'
                        : d >= 3 ? 'bg-patuju-yellow/10 text-patuju-yellow border-patuju-yellow'
                            : 'text-gray-500';
                return (
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${color}`}>
                        {d}
                    </span>
                );
            },
        },
        {
            key: 'estado',
            header: 'Estado',
            sortable: true,
            render: (t: Tramite) => (
                <Badge variant={estadoColors[t.estado] ?? 'default'}>
                    {estadoLabels[t.estado] ?? t.estado}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Trámites</h2>
                    <p className="mt-0.5 text-xs text-excel-muted dark:text-gray-400">
                        Consulta y filtra los trámites registrados.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={exportar}>
                        <Icon name="download" size={15} />
                        Exportar Excel
                    </Button>
                    {can('tramites', 'creacion') && areasCreacionData.length > 0 && (
                        <Button onClick={abrirCreacion}>
                            <Icon name="plus" size={15} />
                            Nuevo Trámite
                        </Button>
                    )}
                </div>
            </div>

            <Card padding="sm">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <Input
                        id="filtro-numero-tramite"
                        label="N° Trámite"
                        value={numeroTramite}
                        onChange={(e) => setNumeroTramite(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscar()}
                        placeholder="Ej. 12 o DLA-0012/2026"
                        inputMode="text"
                        autoComplete="off"
                    />

                    <Input
                        id="filtro-numero-diamante"
                        label="N° Diamante"
                        value={numeroDiamante}
                        onChange={(e) => setNumeroDiamante(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscar()}
                        placeholder="Ej. DIA-1234"
                        autoComplete="off"
                    />

                    <div className="sm:col-span-2 xl:col-span-1">
                        <Input
                            id="filtro-descripcion"
                            label="Descripción"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && buscar()}
                            placeholder="Buscar en la descripción..."
                            autoComplete="off"
                        />
                    </div>

                    <RangoCalendario
                        desde={fechaDesde}
                        hasta={fechaHasta}
                        onChange={(desde, hasta) => {
                            setFechaDesde(desde);
                            setFechaHasta(hasta);
                        }}
                        onApply={aplicarRango}
                    />

                    <SearchableSelect
                        id="filtro-area"
                        label="Área"
                        ariaLabel="Área"
                        value={areaId || null}
                        onChange={(value) => filtrarArea(value ?? '')}
                        options={areaOptions}
                        placeholder="Todas las áreas"
                        searchPlaceholder="Buscar área..."
                        emptyMessage="No se encontraron áreas."
                        clearable
                        clearLabel="Todas las áreas"
                        showPath={false}
                        className="w-full"
                    />
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-excel-border pt-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-excel-muted dark:text-gray-400">
                            Recepción
                        </span>
                        <div
                            className="inline-flex rounded-md border border-excel-border-strong bg-excel-surface p-0.5 dark:border-gray-600 dark:bg-gray-800"
                            role="group"
                            aria-label="Filtro por recepción"
                        >
                            {RECEPCION_OPCIONES.map((opcion) => {
                                const activo = recepcion === opcion.value;

                                return (
                                    <button
                                        key={opcion.value}
                                        type="button"
                                        aria-pressed={activo}
                                        onClick={() => filtrarRecepcion(opcion.value)}
                                        className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                                            activo
                                                ? 'bg-excel-green text-white shadow-sm'
                                                : 'text-excel-muted hover:bg-excel-surface-2 hover:text-excel-text dark:text-gray-300 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {opcion.label}
                                    </button>
                                );
                            })}
                        </div>
                        <FilterChip
                            label="Mi área"
                            checked={miAreaActiva}
                            onChange={toggleMiArea}
                            disabled={miAreaId === ''}
                            title={miAreaId ? undefined : 'Tu usuario no tiene área asignada'}
                            icon="building"
                        />
                        <FilterChip
                            label="Hoy"
                            checked={esHoy}
                            onChange={toggleHoy}
                            icon="calendar"
                        />
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                        <Button variant="secondary" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </Button>
                        <Button onClick={buscar}>
                            <Icon name="filter" size={15} />
                            Filtrar
                        </Button>
                    </div>
                </div>
            </Card>

            <Card>
                {selectedIds.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-excel-green/30 bg-excel-green-light/60 px-3 py-2 dark:border-excel-green/40 dark:bg-excel-green/10">
                        <p className="text-sm font-medium text-excel-text dark:text-gray-100">
                            {selectedIds.length} trámite{selectedIds.length === 1 ? '' : 's'} seleccionado{selectedIds.length === 1 ? '' : 's'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedIds([])}>
                                Limpiar
                            </Button>
                            <Button size="sm" onClick={() => setDerivarOpen(true)}>
                                <Icon name="arrow-right" size={14} />
                                Derivar seleccionados
                            </Button>
                        </div>
                    </div>
                )}
                <Table
                    columns={columns}
                    data={tramites.data}
                    keyExtractor={(t) => t.id}
                    emptyMessage="No hay trámites registrados."
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={ordenar}
                    selectable={puedeGestionar}
                    selectedKeys={selectedIds}
                    onSelectionChange={(keys) => setSelectedIds(keys.map(Number))}
                    isRowSelectable={esDerivable}
                    getRowLabel={(t) => `Seleccionar trámite ${t.numero_completo}`}
                />
                <Pagination
                    currentPage={tramites.meta.current_page}
                    lastPage={tramites.meta.last_page}
                    from={tramites.meta.from}
                    to={tramites.meta.to}
                    total={tramites.meta.total}
                    perPage={tramites.meta.per_page}
                    label="trámites"
                    onPageChange={(page) => router.get('/tramites', filtrosAplicados({ page }), { preserveState: true, preserveScroll: true })}
                    onPerPageChange={(perPage) => router.get('/tramites', filtrosAplicados({ per_page: perPage, page: 1 }), { preserveState: true, preserveScroll: true })}
                />
            </Card>

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Trámite">
                <TramiteForm
                    form={createForm}
                    areas={areasCreacionData}
                    secuencias={secuencias}
                    submitUrl="/tramites"
                    onSuccess={() => {
                        setCreateOpen(false);
                        createForm.reset();
                    }}
                    onCancel={() => setCreateOpen(false)}
                />
            </Modal>

            {derivarOpen && (
                <DerivarModal
                    open
                    onClose={() => setDerivarOpen(false)}
                    destinatarios={destinatarios ?? []}
                    submitUrl="/tramites/derivar-varios"
                    tramiteIds={selectedIds}
                    title={`Derivar ${selectedIds.length} trámite${selectedIds.length === 1 ? '' : 's'}`}
                    onSuccess={() => {
                        setDerivarOpen(false);
                        setSelectedIds([]);
                    }}
                />
            )}
        </div>
    );
}
