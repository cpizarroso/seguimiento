import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { etiquetaTipo, formatearBytes } from './formato';
import type { EspacioBackups } from '@/types/backups';

interface Props {
    espacio: EspacioBackups;
}

const COLORES_DONA = ['#2D6A4F', '#D6E4DD'];

export function EstadoAlmacenamiento({ espacio }: Props) {
    const { disco, backups, archivos, proyeccion } = espacio;
    const porcentajeDisco = disco.porcentaje_usado ?? 0;
    const porcentajeCuota = backups.porcentaje_cuota ?? 0;
    const cuotaMb = backups.cuota_bytes / 1048576;
    const cuotaPorBackup = cuotaMb > 0 ? cuotaMb / Math.max(1, backups.maximo) : 0;

    const datosDona = disco.disponible
        ? [
              { nombre: 'Usado', valor: disco.usado_bytes ?? 0 },
              { nombre: 'Libre', valor: disco.libre_bytes ?? 0 },
          ]
        : [
              { nombre: 'Usado', valor: 1 },
              { nombre: 'Libre', valor: 1 },
          ];

    const datosBarras = archivos.map((archivo) => ({
        nombre: archivo.nombre,
        etiqueta: archivo.fecha ?? '',
        mb: archivo.tamano_mb,
        tipo: etiquetaTipo[archivo.tipo],
    }));

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            <Card padding="lg">
                <h3 className="text-sm font-semibold text-excel-text dark:text-gray-100">Espacio del disco</h3>

                {!disco.disponible ? (
                    <div className="mt-6 flex flex-col items-center gap-2 text-center">
                        <Icon name="hard-drive" size={28} className="text-excel-muted" />
                        <p className="text-sm font-medium text-excel-text dark:text-gray-200">
                            No disponible en este servidor
                        </p>
                        <p className="text-xs text-excel-muted">
                            La cuota y el tamaño por archivo siguen funcionando.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="relative mx-auto mt-2 h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={datosDona}
                                        dataKey="valor"
                                        nameKey="nombre"
                                        innerRadius={54}
                                        outerRadius={78}
                                        startAngle={90}
                                        endAngle={-270}
                                        strokeWidth={0}
                                    >
                                        {datosDona.map((entrada, indice) => (
                                            <Cell key={entrada.nombre} fill={COLORES_DONA[indice]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(valor: number) => formatearBytes(valor)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-excel-green dark:text-[#6fd394]">
                                    {porcentajeDisco.toLocaleString('es-BO', { maximumFractionDigits: 1 })}%
                                </span>
                                <span className="text-[11px] font-medium uppercase tracking-wide text-excel-muted">
                                    usado
                                </span>
                            </div>
                        </div>
                        <dl className="mt-2 space-y-1 text-xs text-excel-muted">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-excel-green" /> Usado
                                </dt>
                                <dd className="font-semibold text-excel-text dark:text-gray-200">
                                    {formatearBytes(disco.usado_bytes)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-[#D6E4DD]" /> Libre
                                </dt>
                                <dd className="font-semibold text-excel-text dark:text-gray-200">
                                    {formatearBytes(disco.libre_bytes)}
                                </dd>
                            </div>
                        </dl>
                    </>
                )}
            </Card>

            <Card padding="lg">
                <h3 className="text-sm font-semibold text-excel-text dark:text-gray-100">Cuota de backups</h3>

                <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-excel-text dark:text-gray-100">
                        {formatearBytes(backups.total_bytes)}
                    </span>
                    <span className="text-xs text-excel-muted">
                        {cuotaMb > 0 ? `de ${formatearBytes(backups.cuota_bytes)}` : 'Ilimitada'}
                    </span>
                </div>

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-excel-surface-2 dark:bg-gray-700">
                    <div
                        className={`h-full rounded-full transition-all ${
                            porcentajeCuota >= 100 ? 'bg-excel-red' : porcentajeCuota >= 70 ? 'bg-excel-gold' : 'bg-excel-green'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, porcentajeCuota))}%` }}
                    />
                </div>

                <p className="mt-2 text-xs text-excel-muted">
                    {cuotaMb > 0
                        ? `${porcentajeCuota.toLocaleString('es-BO', { maximumFractionDigits: 2 })}% de la cuota utilizada`
                        : 'Sin límite de cuota configurado'}
                </p>

                <dl className="mt-4 space-y-1.5 text-xs text-excel-muted">
                    <div className="flex items-center justify-between gap-2">
                        <dt>Backups almacenados</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">
                            {backups.cantidad} / {backups.maximo}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <dt>Archivos sin registrar</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">{backups.huerfanos}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <dt>Backups que aún caben</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">
                            {proyeccion.backups_hasta_cuota ?? '—'}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <dt>Tamaño medio por backup</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">
                            {proyeccion.tendencia_mb_por_backup.toLocaleString('es-BO', { maximumFractionDigits: 2 })} MB
                        </dd>
                    </div>
                </dl>

                <p className="mt-4 rounded-md bg-excel-surface-2 px-2.5 py-2 text-[11px] leading-relaxed text-excel-muted dark:bg-gray-700/60">
                    Carpeta: <span className="break-all font-mono">{disco.ruta}</span>
                </p>
            </Card>

            <Card padding="lg">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-excel-text dark:text-gray-100">Tamaño por backup</h3>
                    <span className="text-[11px] font-medium text-excel-muted">{archivos.length} archivo(s)</span>
                </div>

                {datosBarras.length === 0 ? (
                    <div className="flex h-44 flex-col items-center justify-center gap-2 text-center text-xs text-excel-muted">
                        <Icon name="database" size={26} />
                        Todavía no hay backups completados.
                    </div>
                ) : (
                    <div className="mt-3 h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={datosBarras}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    width={38}
                                    unit=" MB"
                                />
                                <Tooltip
                                    formatter={(valor: number) => [`${valor.toFixed(2)} MB`, 'Tamaño']}
                                    labelFormatter={(_etiqueta, carga) => {
                                        const primero = carga[0]?.payload as { nombre?: string; tipo?: string } | undefined;
                                        return primero?.nombre ? `${primero.nombre} (${primero.tipo ?? ''})` : '';
                                    }}
                                />
                                {cuotaPorBackup > 0 && (
                                    <ReferenceLine
                                        y={cuotaPorBackup}
                                        stroke="#C1121F"
                                        strokeDasharray="4 3"
                                        label={{
                                            value: 'Cuota por backup',
                                            position: 'insideTopRight',
                                            fontSize: 10,
                                            fill: '#C1121F',
                                        }}
                                    />
                                )}
                                <Bar dataKey="mb" fill="#2D6A4F" radius={[3, 3, 0, 0]} maxBarSize={26} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <p className="mt-3 text-[11px] leading-relaxed text-excel-muted">
                    Cada barra es un archivo real; la retención elimina los antiguos, por eso no se muestra una serie
                    acumulada.
                </p>
            </Card>
        </div>
    );
}
