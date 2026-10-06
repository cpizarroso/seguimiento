import { Card } from '@/components/ui/Card';

export interface ReporteGuardado {
    id: number;
    nombre: string;
    fecha_desde: string | null;
    fecha_hasta: string | null;
    hoy: boolean;
    total_registros: number;
    creado_en: string | null;
    url: string;
}

interface ReporteHistorialProps {
    historial: ReporteGuardado[];
}

export function ReporteHistorial({ historial }: ReporteHistorialProps) {
    return (
        <Card padding="sm" className="print:hidden">
            <h3 className="mb-2 text-base font-semibold text-patuju-green">
                Mis reportes guardados
            </h3>

            {historial.length === 0 ? (
                <p className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    Aún no hay reportes guardados en el storage.
                </p>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {historial.map((item) => (
                        <li key={item.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-gray-900 dark:text-gray-100">
                                    {item.nombre}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {item.hoy
                                        ? 'Hoy'
                                        : `${item.fecha_desde ?? '—'} — ${item.fecha_hasta ?? '—'}`}
                                    {' · '}{item.total_registros} registros
                                    {item.creado_en ? ` · ${item.creado_en}` : ''}
                                </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center rounded-lg border border-patuju-green/30 px-3 py-1 text-xs font-medium text-patuju-green transition-colors hover:bg-patuju-green/10"
                                >
                                    Vista previa
                                </a>
                                <a
                                    href={item.url}
                                    className="inline-flex items-center justify-center rounded-lg border border-patuju-green/30 px-3 py-1 text-xs font-medium text-patuju-green transition-colors hover:bg-patuju-green/10"
                                >
                                    Descargar PDF
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
