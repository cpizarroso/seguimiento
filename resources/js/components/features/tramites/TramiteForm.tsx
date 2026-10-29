import { router } from '@inertiajs/react';
import type { InertiaForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SelectorFechaHora } from '@/components/ui/SelectorFechaHora';
import type { SecuenciasPorArea } from '@/types/tramites';

export interface TramiteAreaOption {
    id: number;
    nombre: string;
    codigo: string;
}

export type TramiteFormType = InertiaForm<{
    descripcion: string;
    numero_diamante: string;
    area_id: string;
    urgente: boolean;
    fecha?: string;
}>;

interface TramiteFormProps {
    form: TramiteFormType;
    areas: TramiteAreaOption[];
    submitUrl: string;
    method?: 'post' | 'put';
    submitLabel?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    /** Secuencias vigentes por área; solo se usa al crear un trámite. */
    secuencias?: SecuenciasPorArea;
    /** Número ya asignado al trámite; solo se usa al editar. */
    numeroAsignado?: string;
    /** Muestra el selector de fecha y hora; solo al crear un trámite. */
    mostrarFechaHora?: boolean;
}

export function TramiteForm({
    form,
    areas,
    submitUrl,
    method = 'post',
    submitLabel = 'Guardar',
    onSuccess,
    onCancel,
    secuencias,
    numeroAsignado,
    mostrarFechaHora = false,
}: TramiteFormProps) {
    const { data, setData, post, put, processing, errors } = form;

    // Recarga la previsualización de la numeración cuando la fecha cambia de gestión.
    const yearCargado = useRef<number | null>(data.fecha ? Number(data.fecha.slice(0, 4)) : null);

    useEffect(() => {
        if (!mostrarFechaHora || !data.fecha) return;

        const year = Number(data.fecha.slice(0, 4));

        if (!Number.isFinite(year) || year === yearCargado.current) return;

        yearCargado.current = year;
        router.reload({ only: ['secuencias'], data: { year } });
    }, [data.fecha, mostrarFechaHora]);

    const secuencia = secuencias?.[String(data.area_id)];
    const numeroInfo = numeroAsignado
        ? {
            rotulo: 'N° de trámite',
            principal: numeroAsignado,
            secundario: null as string | null,
            nota: 'Número asignado a este trámite.',
        }
        : secuencia
            ? {
                rotulo: 'Próximo N° de trámite',
                principal: secuencia.numero_completo,
                secundario: secuencia.ultimo_completo ? `Último emitido: ${secuencia.ultimo_completo}` : null,
                nota: 'El número se asigna al guardar.',
            }
            : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const opciones = onSuccess ? { onSuccess } : undefined;

        if (method === 'put') {
            put(submitUrl, opciones);
        } else {
            post(submitUrl, opciones);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {numeroInfo && (
                    <div
                        id="tramite-numero"
                        aria-live="polite"
                        className="rounded-lg border border-excel-border bg-excel-surface-2 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/60 sm:col-span-2"
                    >
                        <div className="flex flex-wrap items-baseline justify-between gap-1">
                            <span className="text-xs font-semibold text-excel-muted dark:text-gray-300">
                                {numeroInfo.rotulo}
                            </span>
                            <span className="font-mono text-sm font-semibold text-excel-text dark:text-white">
                                {numeroInfo.principal}
                            </span>
                        </div>
                        {numeroInfo.secundario && (
                            <p className="mt-0.5 text-xs text-excel-muted dark:text-gray-400">
                                {numeroInfo.secundario}
                            </p>
                        )}
                        <p className="mt-0.5 text-xs italic text-excel-muted dark:text-gray-400">
                            {numeroInfo.nota}
                        </p>
                    </div>
                )}

                <Select
                    label="Área"
                    required
                    placeholder="Seleccione un área"
                    options={areas.map((a) => ({ value: String(a.id), label: `${a.nombre} (${a.codigo})` }))}
                    value={data.area_id}
                    onChange={(e) => setData('area_id', e.target.value)}
                    error={errors.area_id}
                />

                <Input
                    label="Número Diamante"
                    value={data.numero_diamante}
                    onChange={(e) => setData('numero_diamante', e.target.value)}
                    error={errors.numero_diamante}
                    placeholder="Opcional"
                />

                {mostrarFechaHora && (
                    <div className="sm:col-span-2">
                        <SelectorFechaHora
                            id="tramite-fecha"
                            label="Fecha y hora del trámite"
                            value={data.fecha ?? ''}
                            onChange={(valor) => setData('fecha', valor)}
                            error={errors.fecha}
                            required
                        />
                        <p className="mt-1 text-xs text-excel-muted dark:text-gray-400">
                            Por defecto se usa la fecha y hora actual. No se permiten fechas futuras.
                        </p>
                    </div>
                )}

                <div className="sm:col-span-2">
                    <label htmlFor="tramite-descripcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                        Descripción <span className="text-patuju-red">*</span>
                    </label>
                    <textarea
                        id="tramite-descripcion"
                        rows={4}
                        className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                        value={data.descripcion}
                        onChange={(e) => setData('descripcion', e.target.value)}
                    />
                    {errors.descripcion && <p className="text-xs text-patuju-red mt-1">{errors.descripcion}</p>}
                </div>

                <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-patuju-red/30 bg-patuju-red/5 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={data.urgente}
                            onChange={(e) => setData('urgente', e.target.checked)}
                            className="h-4 w-4 rounded accent-[#C1121F]"
                        />
                        <span className="text-sm font-medium text-patuju-red">
                            Marcar como urgente
                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                Se mostrará con prioridad en el listado
                            </span>
                        </span>
                    </label>
                    {errors.urgente && <p className="text-xs text-patuju-red mt-1">{errors.urgente}</p>}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" loading={processing}>{submitLabel}</Button>
                <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : window.history.back())}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}