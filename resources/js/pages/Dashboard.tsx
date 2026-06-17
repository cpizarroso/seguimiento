import { router } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SemanalChart } from '@/components/features/reporte/SemanalChart';
import { TramitesPorFuncionarioChart } from '@/components/features/reporte/TramitesPorFuncionarioChart';

interface FuncionarioOption {
    id: number;
    name: string;
}

interface FuncionarioTramite {
    id: number;
    name: string;
    total: number;
}

interface DashboardProps {
    total_tramites: number;
    por_estado: Record<string, number>;
    iniciados_por_dia: Record<number, number>;
    finalizados_por_dia: Record<number, number>;
    tramites_por_funcionario: FuncionarioTramite[];
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
        </div>
    );
}
