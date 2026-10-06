import { useEffect, useMemo, useState } from 'react';

interface RangoCalendarioProps {
    desde: string;
    hasta: string;
    deshabilitado?: boolean;
    onChange: (desde: string, hasta: string) => void;
}

function aISO(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function desdeISO(valor: string): Date | null {
    if (!valor) return null;
    const [y, m, d] = valor.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function formatearCorto(valor: string): string {
    const f = desdeISO(valor);
    if (!f) return '';
    return f.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function RangoCalendario({ desde, hasta, deshabilitado = false, onChange }: RangoCalendarioProps) {
    const [abierto, setAbierto] = useState(false);
    const hoy = useMemo(() => new Date(), []);
    const [mesVisible, setMesVisible] = useState<Date>(() => desdeISO(desde) ?? new Date());

    useEffect(() => {
        if (abierto) {
            setMesVisible(desdeISO(desde) ?? new Date());
        }
    }, [abierto, desde]);

    const desdeDate = desdeISO(desde);
    const hastaDate = desdeISO(hasta);

    const celdas = useMemo(() => {
        const primero = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1);
        // Semana empieza en lunes: convierte domingo (0) a 6.
        const desfase = (primero.getDay() + 6) % 7;
        const diasEnMes = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate();
        const lista: (Date | null)[] = [];
        for (let i = 0; i < desfase; i++) lista.push(null);
        for (let d = 1; d <= diasEnMes; d++) {
            lista.push(new Date(mesVisible.getFullYear(), mesVisible.getMonth(), d));
        }
        return lista;
    }, [mesVisible]);

    const elegirDia = (dia: Date) => {
        const iso = aISO(dia);
        if (!desde || (desde && hasta)) {
            onChange(iso, '');
            return;
        }
        if (iso < desde) {
            onChange(iso, desde);
            return;
        }
        onChange(desde, iso);
    };

    const enRango = (dia: Date): boolean => {
        if (!desdeDate) return false;
        const t = dia.getTime();
        if (desdeDate && hastaDate) {
            return t >= desdeDate.getTime() && t <= hastaDate.getTime();
        }
        return t === desdeDate.getTime();
    };

    const esExtremo = (dia: Date): boolean => {
        const t = dia.getTime();
        return t === desdeDate?.getTime() || t === hastaDate?.getTime();
    };

    const etiqueta = desde
        ? `${formatearCorto(desde)}${hasta ? ` — ${formatearCorto(hasta)}` : ' — …'}`
        : 'Seleccionar rango…';

    return (
        <div className="relative">
            <span className="mb-0.5 block text-[11px] font-medium text-patuju-green dark:text-patuju-green">
                Fecha inicial y final
            </span>
            <button
                type="button"
                disabled={deshabilitado}
                onClick={() => setAbierto((v) => !v)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100 shadow-sm transition-colors hover:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green disabled:opacity-50"
                aria-haspopup="dialog"
                aria-expanded={abierto}
            >
                <span className="flex items-center gap-2">
                    <span aria-hidden="true">📅</span>
                    <span className={desde ? '' : 'text-gray-400'}>{etiqueta}</span>
                </span>
                <span aria-hidden="true" className="text-gray-400">▾</span>
            </button>

            {abierto && !deshabilitado && (
                <div
                    role="dialog"
                    aria-label="Calendario de rango"
                    className="absolute z-30 mt-2 w-72 rounded-xl border border-patuju-green/20 bg-white dark:bg-gray-800 p-3 shadow-lg"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
                            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="Mes anterior"
                        >
                            ‹
                        </button>
                        <p className="text-sm font-semibold text-patuju-green">
                            {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
                        </p>
                        <button
                            type="button"
                            onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
                            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="Mes siguiente"
                        >
                            ›
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
                        {DIAS_SEMANA.map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                        {celdas.map((dia, i) =>
                            dia === null ? (
                                <span key={`vacio-${i}`} />
                            ) : (
                                <button
                                    key={dia.toISOString()}
                                    type="button"
                                    onClick={() => elegirDia(dia)}
                                    className={`rounded-full px-0 py-1.5 text-xs transition-colors ${
                                        esExtremo(dia)
                                            ? 'bg-patuju-green font-bold text-white'
                                            : enRango(dia)
                                              ? 'bg-patuju-green/15 font-medium text-patuju-green'
                                              : 'text-gray-700 hover:bg-patuju-cream dark:text-gray-200 dark:hover:bg-gray-700'
                                    } ${dia.toDateString() === hoy.toDateString() ? 'ring-1 ring-patuju-yellow' : ''}`}
                                >
                                    {dia.getDate()}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('', '');
                            }}
                            className="text-xs text-gray-500 hover:text-patuju-red dark:text-gray-400"
                        >
                            Limpiar
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const iso = aISO(hoy);
                                    onChange(iso, iso);
                                    setMesVisible(hoy);
                                }}
                                className="rounded-full border border-patuju-green/30 px-3 py-1 text-xs font-medium text-patuju-green hover:bg-patuju-green/10"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={() => setAbierto(false)}
                                className="rounded-full bg-patuju-green px-3 py-1 text-xs font-medium text-white hover:bg-patuju-green/90"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
