import { router } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SemanalChart } from '@/components/features/reporte/SemanalChart';
import { TramitesPorFuncionarioChart } from '@/components/features/reporte/TramitesPorFuncionarioChart';
import { TramitesPorAreaChart } from '@/components/features/reporte/TramitesPorAreaChart';

interface FuncionarioOption {
    id: number;
    name: string;
}

interface FuncionarioTramite {
    id: number;
    name: string;
    total: number;
}

interface UrgenteItem {
    id: number;
    numero_completo: string;
    descripcion: string;
    dias: number;
    area_sigla: string;
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
    tramites_por_funcionario: FuncionarioTramite[];
    tramites_por_area: { name: string; total: number }[];
    tramites_urgentes: UrgentesData;
    funcionarios: FuncionarioOption[];
    filtro_funcionario_id: number | null;
}

const estadoConfig: Record<string, { label: string; color: string }> = {
    iniciado: { label: 'Iniciados', color: 'text-blue-600' },
    proceso: { label: 'En Proceso', color: 'text-patuju-yellow' },
    observado: { label: 'Observados', color: 'text-gray-600' },
    finalizado: { label: 'Finalizados', color: 'text-patuju-green' },
};

export default function Dashboard({
    total_tramites,
    por_estado,
    iniciados_por_dia,
    finalizados_por_dia,
    tramites_por_funcionario,
    tramites_por_area,
    tramites_urgentes,
    funcionarios,
    filtro_funcionario_id,
}: DashboardProps) {
    const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        router.get('/dashboard', { funcionario_id: value || undefined }, {
            preserveState: true,
            replace: true,
        });
    };

    const options = [
        { value: '', label: 'Todos los usuarios' },
        ...funcionarios.map((f) => ({ value: String(f.id), label: f.name })),
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Dashboard</h2>
                <div className="w-64">
                    <Select
                        label="Filtrar por usuario"
                        options={options}
                        value={filtro_funcionario_id ? String(filtro_funcionario_id) : ''}
                        onChange={handleFiltroChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Trámites</p>
                    <p className="mt-1 text-3xl font-bold text-patuju-green">{total_tramites}</p>
                </Card>
                {Object.entries(estadoConfig).map(([estado, config]) => (
                    <Card key={estado}>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{config.label}</p>
                        <p className={`mt-1 text-3xl font-bold ${config.color}`}>
                            {por_estado[estado] ?? 0}
                        </p>
                    </Card>
                ))}
            </div>

            {tramites_urgentes.lista.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold text-patuju-green mb-4">Trámites Urgentes</h3>
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
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-patuju-green truncate">{item.numero_completo}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.descripcion}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    {item.area_sigla && (
                                        <span className="text-xs text-gray-400">{item.area_sigla}</span>
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
                    color="#2D6A4F"
                />
                <SemanalChart
                    title="Trámites Finalizados por Día de la Semana"
                    data={finalizados_por_dia}
                    color="#C1121F"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TramitesPorFuncionarioChart data={tramites_por_funcionario} />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TramitesPorAreaChart data={tramites_por_area} />
            </div>
        </div>
    );
}
