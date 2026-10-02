import { useMemo } from 'react';
import type { UseFormReturn } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export interface PuestoHistorialOption {
    id: number;
    nombre: string;
    sigla: string;
    area_id: number;
}

export interface AreaHistorialOption {
    id: number;
    nombre: string;
    sigla: string;
}

export type CambiarPuestoFormType = UseFormReturn<{ area_id: string; puesto_id: string }>;

interface CambiarPuestoModalProps {
    form: CambiarPuestoFormType;
    areas: AreaHistorialOption[];
    puestos: PuestoHistorialOption[];
    submitUrl: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function CambiarPuestoModal({ form, areas, puestos, submitUrl, onSuccess, onCancel }: CambiarPuestoModalProps) {
    const { data, setData, put, processing, errors } = form;

    const puestosFiltrados = useMemo(
        () => (data.area_id ? puestos.filter((p) => p.area_id === Number(data.area_id)) : puestos),
        [data.area_id, puestos],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const opciones = onSuccess ? { onSuccess } : undefined;

        put(submitUrl, opciones);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Al guardar, el puesto vigente se cerrará y se iniciará un registro nuevo en el historial.
            </p>

            <Select
                label="Área"
                options={[
                    { value: '', label: 'Seleccionar área' },
                    ...areas.map((a) => ({ value: String(a.id), label: `${a.nombre} (${a.sigla})` })),
                ]}
                value={data.area_id}
                onChange={(e) => {
                    setData('area_id', e.target.value);
                    setData('puesto_id', '');
                }}
                error={errors.area_id}
            />

            <Select
                label="Puesto"
                options={[
                    { value: '', label: puestosFiltrados.length ? 'Seleccionar puesto' : 'Seleccione un área primero' },
                    ...puestosFiltrados.map((p) => ({ value: String(p.id), label: `${p.nombre} (${p.sigla})` })),
                ]}
                value={data.puesto_id}
                onChange={(e) => setData('puesto_id', e.target.value)}
                error={errors.puesto_id}
                disabled={!data.area_id}
            />

            <div className="flex gap-3 pt-2">
                <Button type="submit" loading={processing}>Guardar</Button>
                <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : window.history.back())}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}