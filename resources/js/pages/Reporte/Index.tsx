import { Card } from '@/components/ui/Card';
import { SemanalChart } from '@/components/features/reporte/SemanalChart';
import { TramitesPorAreaChart } from '@/components/features/reporte/TramitesPorAreaChart';

interface AreaRow {
    name: string;
    total: number;
}

interface ReporteProps {
    total_tramites: number;
    por_estado: Record<string, number>;
    iniciados_por_dia: Record<number, number>;
    finalizados_por_dia: Record<number, number>;
    tramites_por_area: AreaRow[];
    auth_user: { id: number; name: string; role: string };
    filtro_user_id: number;
    tramites_por_mes: Record<string, number>;
}

const estadoConfig: Record<string, { label: string; color: string }> = {
    iniciado: { label: 'Iniciados', color: 'text-blue-600' },
    proceso: { label: 'En Proceso', color: 'text-patuju-yellow' },
    observado: { label: 'Observados', color: 'text-gray-600 dark:text-gray-400' },
    finalizado: { label: 'Finalizados', color: 'text-patuju-green' },
};

const mesLabels: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

export default function Reporte({
    total_tramites,
    por_estado,
    iniciados_por_dia,
    finalizados_por_dia,
    tramites_por_area,
    auth_user,
    filtro_user_id,
    tramites_por_mes,
}: ReporteProps) {
    const esAdmin = auth_user.role === 'admin';
    const esMiReporte = filtro_user_id === auth_user.id;
    const titulo = esAdmin && !esMiReporte
        ? `Reporte — Usuario #${filtro_user_id}`
        : 'Mi Reporte';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">
                        {titulo}
                    </h2>
                    {esMiReporte && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Trámites creados por <strong>{auth_user.name}</strong>
                        </p>
                    )}
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
                <TramitesPorAreaChart data={tramites_por_area} />
                <Card>
                    <h3 className="text-lg font-semibold text-patuju-green mb-4">
                        Trámites por Mes
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(tramites_por_mes).slice(-6).map(([mes, total]) => {
                            const [, mm] = mes.split('-');
                            return (
                                <div key={mes} className="flex items-center gap-3">
                                    <span className="w-20 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        {mesLabels[mm] ?? mm} {mes.split('-')[0]}
                                    </span>
                                    <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-patuju-green rounded-full transition-all"
                                            style={{ width: `${Math.min((total / Math.max(...Object.values(tramites_por_mes))) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-patuju-green w-8 text-right">
                                        {total}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
}
