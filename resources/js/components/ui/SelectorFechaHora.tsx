import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

interface SelectorFechaHoraProps {
    /** Etiqueta del campo. */
    label?: string;
    /** Valor en formato `YYYY-MM-DDTHH:mm`. */
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
    deshabilitado?: boolean;
    id?: string;
}

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function dosDigitos(valor: number): string {
    return String(valor).padStart(2, '0');
}

function aISO(fecha: Date): string {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function aValor(fecha: Date): string {
    return `${aISO(fecha)}T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

/** Fecha y hora actual del sistema en formato `YYYY-MM-DDTHH:mm`. */
export function fechaHoraActual(): string {
    return aValor(new Date());
}

function desdeISO(valor: string): Date | null {
    if (!valor) return null;
    const [fecha, hora] = valor.split('T');
    const [y, m, d] = (fecha ?? '').split('-').map(Number);
    if (!y || !m || !d) return null;
    const [hh, mm] = (hora ?? '00:00').split(':').map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0);
}

function formatear(valor: string): string {
    const fecha = desdeISO(valor);
    if (!fecha) return '';
    const dia = fecha.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dia} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

export function SelectorFechaHora({
    label = 'Fecha y hora',
    value,
    onChange,
    error,
    required = false,
    deshabilitado = false,
    id,
}: SelectorFechaHoraProps) {
    const [abierto, setAbierto] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoy, setHoy] = useState(() => new Date());
    const [mesVisible, setMesVisible] = useState<Date>(() => desdeISO(value) ?? new Date());
    const [dia, setDia] = useState(() => aISO(desdeISO(value) ?? new Date()));
    const [hora, setHora] = useState(() => (desdeISO(value) ?? new Date()).getHours());
    const [minuto, setMinuto] = useState(() => (desdeISO(value) ?? new Date()).getMinutes());

    const abrir = () => {
        const ahora = new Date();
        const base = desdeISO(value) ?? ahora;
        setHoy(ahora);
        setMesVisible(base);
        setDia(aISO(base));
        setHora(base.getHours());
        setMinuto(base.getMinutes());
        setAbierto(true);
    };

    useEffect(() => {
        if (!abierto) return;

        const handleClick = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setAbierto(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setAbierto(false);
            }
        };

        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [abierto]);

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

    const hoyISO = aISO(hoy);
    const esHoy = dia === hoyISO;
    const horaMaxima = esHoy ? hoy.getHours() : 23;
    const minutoMaximo = esHoy && hora === hoy.getHours() ? hoy.getMinutes() : 59;

    const aplicar = () => {
        onChange(`${dia}T${dosDigitos(hora)}:${dosDigitos(minuto)}`);
        setAbierto(false);
    };

    const elegirAhora = () => {
        const ahora = new Date();
        setHoy(ahora);
        setMesVisible(ahora);
        setDia(aISO(ahora));
        setHora(ahora.getHours());
        setMinuto(ahora.getMinutes());
        onChange(aValor(ahora));
        setAbierto(false);
    };

    const opcionesHora = Array.from({ length: 24 }, (_, i) => i);
    const opcionesMinuto = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label htmlFor={id} className="mb-1 block text-sm font-medium text-patuju-green dark:text-patuju-green">
                    {label} {required && <span className="text-patuju-red">*</span>}
                </label>
            )}
            <button
                id={id}
                type="button"
                disabled={deshabilitado}
                onClick={() => (abierto ? setAbierto(false) : abrir())}
                className={`flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-excel-surface px-3 text-sm text-excel-text shadow-sm transition-colors hover:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 ${
                    error
                        ? 'border-excel-red focus:ring-excel-red/20'
                        : 'border-excel-border-strong dark:border-gray-600'
                }`}
                aria-haspopup="dialog"
                aria-expanded={abierto}
                aria-label={label ? `Seleccionar ${label.toLowerCase()}` : 'Seleccionar fecha y hora'}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <Icon name="calendar" size={15} className="flex-shrink-0 text-excel-muted" />
                    <span className={`truncate ${value ? '' : 'text-gray-400'}`}>
                        {value ? formatear(value) : 'Seleccionar fecha y hora…'}
                    </span>
                </span>
                <Icon name="chevron-down" size={14} className="flex-shrink-0 text-excel-muted" />
            </button>

            {error && <p className="mt-1 text-xs text-excel-red">{error}</p>}

            {abierto && !deshabilitado && (
                <div
                    role="dialog"
                    aria-label="Calendario de fecha y hora"
                    className="absolute z-40 mt-2 w-80 rounded-xl border border-patuju-green/20 bg-white p-3 shadow-lg dark:bg-gray-800"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
                            className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            aria-label="Mes anterior"
                        >
                            <Icon name="chevron-left" size={15} />
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
                            <Icon name="chevron-right" size={15} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
                        {DIAS_SEMANA.map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                        {celdas.map((fecha, i) => {
                            if (fecha === null) {
                                return <span key={`vacio-${i}`} />;
                            }

                            const iso = aISO(fecha);
                            const futuro = iso > hoyISO;
                            const seleccionado = iso === dia;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    disabled={futuro}
                                    onClick={() => {
                                        setDia(iso);
                                        if (iso === hoyISO) {
                                            setHora((h) => Math.min(h, hoy.getHours()));
                                            setMinuto((m) => Math.min(m, hoy.getMinutes()));
                                        }
                                    }}
                                    aria-label={fecha.toLocaleDateString('es-BO')}
                                    aria-pressed={seleccionado}
                                    className={`rounded-full px-0 py-1.5 text-xs transition-colors ${
                                        seleccionado
                                            ? 'bg-patuju-green font-bold text-white'
                                            : futuro
                                                ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                                : 'text-gray-700 hover:bg-patuju-cream dark:text-gray-200 dark:hover:bg-gray-700'
                                    } ${iso === hoyISO ? 'ring-1 ring-patuju-yellow' : ''}`}
                                >
                                    {fecha.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="block text-xs font-medium text-excel-muted dark:text-gray-400">
                            Hora
                            <select
                                value={hora}
                                onChange={(event) => setHora(Number(event.target.value))}
                                className="mt-1 block w-full rounded-md border border-excel-border-strong bg-excel-surface px-2 py-1 text-sm text-excel-text dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                aria-label="Hora"
                            >
                                {opcionesHora.map((opcion) => (
                                    <option key={opcion} value={opcion} disabled={opcion > horaMaxima}>
                                        {dosDigitos(opcion)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-xs font-medium text-excel-muted dark:text-gray-400">
                            Minuto
                            <select
                                value={minuto}
                                onChange={(event) => setMinuto(Number(event.target.value))}
                                className="mt-1 block w-full rounded-md border border-excel-border-strong bg-excel-surface px-2 py-1 text-sm text-excel-text dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                aria-label="Minuto"
                            >
                                {opcionesMinuto.map((opcion) => (
                                    <option key={opcion} value={opcion} disabled={opcion > minutoMaximo}>
                                        {dosDigitos(opcion)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                setAbierto(false);
                            }}
                            className="text-xs text-gray-500 hover:text-patuju-red dark:text-gray-400"
                        >
                            Limpiar
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={elegirAhora}
                                className="rounded-full border border-patuju-green/30 px-3 py-1 text-xs font-medium text-patuju-green hover:bg-patuju-green/10"
                            >
                                Ahora
                            </button>
                            <button
                                type="button"
                                onClick={aplicar}
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
