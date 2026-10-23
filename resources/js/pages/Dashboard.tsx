import { router } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';
import { SemanalChart } from '@/components/features/reporte/SemanalChart';
import { TramitesPorUsuarioChart } from '@/components/features/reporte/TramitesPorUsuarioChart';
import { TramitesPorAreaChart } from '@/components/features/reporte/TramitesPorAreaChart';

interface UsuarioOption {
    id: number;
    name: string;
}

interface UsuarioTramite {
    id: number;
    name: string;
    total: number;
}

interface UrgenteItem {
    id: number;
    numero_completo: string;
    descripcion: string;
    dias: number;
    area_codigo: string;
    estado: string;
}

interface UrgentesData {
    tres_dias: number;
    cuatro_dias: number;
    cinco_dias: number;
    lista: UrgenteItem[];
}

interface DashboardProps {
    total_tramites: number;
    por_estado: Record<string, number>;
    iniciados_por_dia: Record<number, number>;
    finalizados_por_dia: Record<number, number>;
    tramites_por_usuario: UsuarioTramite[];
    tramites_por_area: { name: string; total: number }[];
    tramites_urgentes: UrgentesData;
    usuarios: UsuarioOption[];
    filtro_usuario_id: number | null;
}

const estadoConfig: Record<string, { label: string; color: string; accent: string; soft: string; icon: IconName }> = {
    iniciado: { label: 'Iniciados', color: 'text-excel-blue', accent: 'border-l-excel-blue', soft: 'bg-[#e5f1fb] text-excel-blue dark:bg-excel-blue/10 dark:text-[#7cc0f5]', icon: 'info' },
    proceso: { label: 'En Proceso', color: 'text-[#8a6700] dark:text-excel-gold', accent: 'border-l-excel-gold', soft: 'bg-[#fff8d6] text-[#8a6700] dark:bg-excel-gold/10 dark:text-excel-gold', icon: 'clock' },
    observado: { label: 'Observados', color: 'text-excel-muted', accent: 'border-l-excel-border-strong', soft: 'bg-excel-surface-2 text-excel-muted dark:bg-gray-700 dark:text-gray-300', icon: 'warning' },
    finalizado: { label: 'Finalizados', color: 'text-excel-green', accent: 'border-l-excel-green', soft: 'bg-excel-green-light text-excel-green dark:bg-excel-green/15 dark:text-[#6fd394]', icon: 'check' },
};

export default function Dashboard({
    total_tramites,
    por_estado,
    iniciados_por_dia,
    finalizados_por_dia,
    tramites_por_usuario,
    tramites_por_area,
    tramites_urgentes,
    usuarios,
    filtro_usuario_id,
}: DashboardProps) {
    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        router.get('/dashboard', { usuario_id: value || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    const options = [
        { value: '', label: 'Todos los usuarios' },
        ...usuarios.map((u) => ({ value: String(u.id), label: u.name })),
    ];

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-excel-green">
                        <Icon name="dashboard" size={13} />
                        Panel de control
                    </div>
                    <h2 className="text-2xl font-semibold text-excel-text dark:text-gray-100">Dashboard</h2>
                    <p className="mt-0.5 text-xs text-excel-muted dark:text-gray-400">
                        Resumen general del estado de los trámites.
                    </p>
                </div>
                <div className="w-full sm:w-64">
                    <Select
                        label="Filtrar por usuario"
                        options={options}
                        value={filtro_usuario_id ? String(filtro_usuario_id) : ''}
                        onChange={handleFiltroChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Card className="border-l-4 border-l-excel-green">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-xs font-medium text-excel-muted dark:text-gray-400">Total Trámites</p>
                            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-excel-text dark:text-gray-100">{total_tramites}</p>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-excel-green-light text-excel-green dark:bg-excel-green/15 dark:text-[#6fd394]">
                            <Icon name="document" size={17} />
                        </span>
                    </div>
                </Card>
                {Object.entries(estadoConfig).map(([estado, config]) => (
                    <Card key={estado} className={`border-l-4 ${config.accent}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium text-excel-muted dark:text-gray-400">{config.label}</p>
                                <p className={`mt-1.5 text-3xl font-semibold tracking-tight ${config.color}`}>
                                    {por_estado[estado] ?? 0}
                                </p>
                            </div>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-md ${config.soft}`}>
                                <Icon name={config.icon} size={17} />
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {tramites_urgentes.lista.length > 0 && (
                <Card>
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-excel-text dark:text-gray-100">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#fdecea] text-excel-red dark:bg-excel-red/10 dark:text-[#f28b82]">
                            <Icon name="warning" size={15} />
                        </span>
                        Trámites Urgentes
                    </h3>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 text-center p-3 rounded-lg bg-patuju-yellow/10 border border-patuju-yellow/30">
                            <p className="text-2xl font-bold text-patuju-yellow">{tramites_urgentes.tres_dias}</p>
                            <p className="text-xs text-gray-600">3+ días</p>
                        </div>
                        <div className="flex-1 text-center p-3 rounded-lg bg-patuju-orange/10 border border-patuju-orange/30">
                            <p className="text-2xl font-bold text-patuju-orange">{tramites_urgentes.cuatro_dias}</p>
                            <p className="text-xs text-gray-600">4+ días</p>
                        </div>
                        <div className="flex-1 text-center p-3 rounded-lg bg-patuju-red/10 border border-patuju-red/30">
                            <p className="text-2xl font-bold text-patuju-red">{tramites_urgentes.cinco_dias}</p>
                            <p className="text-xs text-gray-600">5+ días</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {tramites_urgentes.lista.map((item) => (
                            <a
                                key={item.id}
                                href={`/tramites/${item.id}`}
                                className="flex items-center justify-between rounded-md border border-transparent p-2 transition-colors hover:border-excel-border hover:bg-excel-surface-2 dark:hover:border-gray-700 dark:hover:bg-gray-700/60"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-patuju-green truncate">{item.numero_completo}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.descripcion}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    {item.area_codigo && (
                                        <span className="text-xs text-gray-400">{item.area_codigo}</span>
                                    )}
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                        item.dias >= 5 ? 'bg-patuju-red/10 text-patuju-red'
                                        : item.dias >= 4 ? 'bg-patuju-orange/10 text-patuju-orange'
                                        : 'bg-patuju-yellow/10 text-patuju-yellow'
                                    }`}>
                                        {item.dias}
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SemanalChart
                    title="Trámites Iniciados por Día de la Semana"
                    data={iniciados_por_dia}
                    color="#107C41"
                />
                <SemanalChart
                    title="Trámites Finalizados por Día de la Semana"
                    data={finalizados_por_dia}
                    color="#C42B1C"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TramitesPorUsuarioChart data={tramites_por_usuario} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TramitesPorAreaChart data={tramites_por_area} />
            </div>
        </div>
    );
}
