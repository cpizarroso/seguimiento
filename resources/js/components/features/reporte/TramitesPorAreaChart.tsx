import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaRow {
    name: string;
    total: number;
}

interface Props {
    data: AreaRow[];
}

const COLORS = ['#2D6A4F', '#F4A100', '#C1121F', '#1E6091', '#7B2D8E'];

export function TramitesPorAreaChart({ data }: Props) {
    const total = data.reduce((sum, r) => sum + r.total, 0);

    return (
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-patuju-green/20 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green">
                    Trámites por Área
                </h3>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total: <span className="text-patuju-green font-bold">{total}</span>
                </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [value, 'Trámites']} />
                    <Bar dataKey="total" fill="#1E6091" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
