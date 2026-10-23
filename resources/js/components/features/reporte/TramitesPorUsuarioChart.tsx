import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LabelList,
} from 'recharts';

interface UsuarioTramite {
    id: number;
    name: string;
    total: number;
}

interface TramitesPorUsuarioChartProps {
    data: UsuarioTramite[];
}

export function TramitesPorUsuarioChart({ data }: TramitesPorUsuarioChartProps) {
    const total = data.reduce((sum, u) => sum + u.total, 0);
    const chartData = data.map((u) => ({
        ...u,
        label: u.name,
    }));

    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-patuju-green/20 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green">
                    Trámites por Usuario
                </h3>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total: <span className="text-patuju-green font-bold">{total}</span>
                </span>
            </div>
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
                    <Tooltip formatter={(value) => [value ?? 0, 'Trámites']} />
                    <Bar dataKey="total" fill="#2D6A4F" radius={[0, 4, 4, 0]}>
                        <LabelList dataKey="total" position="right" className="fill-patuju-green text-xs font-bold" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
