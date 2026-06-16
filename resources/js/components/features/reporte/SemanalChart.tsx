import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DAY_LABELS: Record<number, string> = {
    1: 'Dom',
    2: 'Lun',
    3: 'Mar',
    4: 'Mié',
    5: 'Jue',
    6: 'Vie',
    7: 'Sáb',
};

const DAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

interface SemanalChartProps {
    title: string;
    data: Record<number, number>;
    color: string;
}

export function SemanalChart({ title, data, color }: SemanalChartProps) {
    const chartData = DAY_ORDER.map((dia) => ({
        dia: DAY_LABELS[dia],
        total: data[dia] ?? 0,
    }));

    return (
            <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-patuju-green/20 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-patuju-green dark:text-patuju-green mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dia" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
