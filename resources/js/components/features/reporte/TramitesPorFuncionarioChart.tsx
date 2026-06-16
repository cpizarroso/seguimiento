import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface FuncionarioTramite {
    id: number;
    nombre: string;
    puesto: string;
    total: number;
}

interface TramitesPorFuncionarioChartProps {
    data: FuncionarioTramite[];
}

export function TramitesPorFuncionarioChart({ data }: TramitesPorFuncionarioChartProps) {
    const chartData = data.map((f) => ({
        ...f,
        label: `${f.nombre} (${f.puesto})`,
    }));

    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-patuju-green/20 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green mb-4">
                Trámites por Funcionario según su Puesto
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 20, right: 20, top: 10, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                        type="category"
                        dataKey="label"
                        width={250}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value: number) => [value, 'Trámites']} />
                    <Bar dataKey="total" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
