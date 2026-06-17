import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Area, Puesto } from '@/types/generated/Tramite';

interface EditProps {
    area: Area;
}

let puestoKey = 0;

function initPuestos(area: Area): { _key: number; id?: number; nombre: string; descripcion: string }[] {
    const max = area.puestos?.reduce((m, p) => Math.max(m, p.id), 0) ?? 0;
    puestoKey = max;
    return (area.puestos ?? []).map((p) => ({
        _key: p.id,
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
    }));
}

export default function AreasEdit({ area }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: area.nombre,
        descripcion: area.descripcion ?? '',
        puestos: initPuestos(area),
    });

    const addPuesto = () => {
        setData('puestos', [...data.puestos, { _key: ++puestoKey, nombre: '', descripcion: '' }]);
    };

    const removePuesto = (key: number) => {
        setData('puestos', data.puestos.filter((p) => p._key !== key));
    };

    const updatePuesto = (key: number, field: 'nombre' | 'descripcion', value: string) => {
        setData(
            'puestos',
            data.puestos.map((p) => (p._key === key ? { ...p, [field]: value } : p)),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/areas/${area.id}`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Editar Área</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nombre del área"
                        value={data.nombre}
                        onChange={(e) => setData('nombre', e.target.value)}
                        error={errors.nombre}
                    />
                    <div>
                        <label className="block text-sm font-medium text-patuju-green">Descripción</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                        />
                        {errors.descripcion && <p className="text-xs text-patuju-red mt-1">{errors.descripcion}</p>}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-patuju-green">Puestos del área</h3>
                            <Button type="button" variant="secondary" onClick={addPuesto}>
                                + Agregar Puesto
                            </Button>
                        </div>

                        {errors['puestos'] && (
                            <p className="text-xs text-patuju-red mb-2">{errors['puestos']}</p>
                        )}

                        {data.puestos.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No hay puestos en esta área.
                            </p>
                        )}

                        <div className="space-y-3">
                            {data.puestos.map((puesto, idx) => (
                                <div
                                    key={puesto._key}
                                    className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Nombre del puesto"
                                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                            value={puesto.nombre}
                                            onChange={(e) => updatePuesto(puesto._key, 'nombre', e.target.value)}
                                        />
                                        {errors[`puestos.${idx}.nombre`] && (
                                            <p className="text-xs text-patuju-red mt-1">{errors[`puestos.${idx}.nombre`]}</p>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Descripción (opcional)"
                                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                            value={puesto.descripcion}
                                            onChange={(e) => updatePuesto(puesto._key, 'descripcion', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="mt-1 text-patuju-red hover:text-patuju-red/80 text-lg leading-none"
                                        onClick={() => removePuesto(puesto._key)}
                                        title="Quitar puesto"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={processing}>Actualizar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
