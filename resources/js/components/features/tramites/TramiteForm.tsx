import type { UseFormReturn } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export interface TramiteAreaOption {
    id: number;
    nombre: string;
    sigla: string;
}

export type TramiteFormType = UseFormReturn<{
    descripcion: string;
    numero_diamante: string;
    area_id: string;
    urgente: boolean;
}>;

interface TramiteFormProps {
    form: TramiteFormType;
    areas: TramiteAreaOption[];
    submitUrl: string;
    method?: 'post' | 'put';
    submitLabel?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function TramiteForm({
    form,
    areas,
    submitUrl,
    method = 'post',
    submitLabel = 'Guardar',
    onSuccess,
    onCancel,
}: TramiteFormProps) {
    const { data, setData, post, put, processing, errors } = form;

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
                <Select
                    label="Área"
                    required
                    placeholder="Seleccione un área"
                    options={areas.map((a) => ({ value: String(a.id), label: `${a.nombre} (${a.sigla})` }))}
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