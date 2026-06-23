import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Area } from '@/types/generated/Tramite';

interface CreateProps {
    areas?: Area[];
}

function buildTreeOptions(areaList: Area[], level = 0): { value: string; label: string }[] {
    return areaList.flatMap((a) => [
        {
            value: String(a.id),
            label: `${'— '.repeat(level)}${a.nombre} (${a.sigla})`,
        },
        ...(a.children?.length ? buildTreeOptions(a.children, level + 1) : []),
    ]);
}

let puestoKey = 0;

export default function AreasCreate({ areas: allAreas = [] }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
        sigla: '',
        estado: true,
        parent_id: null as number | null,
        puestos: [] as { _key: number; nombre: string; descripcion: string; sigla: string; estado: boolean }[],
    });

    const addPuesto = () => {
        setData('puestos', [...data.puestos, { _key: ++puestoKey, nombre: '', descripcion: '', sigla: '', estado: true }]);
    };

    const removePuesto = (key: number) => {
        setData('puestos', data.puestos.filter((p) => p._key !== key));
    };

    const updatePuesto = (key: number, field: 'nombre' | 'descripcion' | 'sigla' | 'estado', value: string | boolean) => {
        setData(
            'puestos',
            data.puestos.map((p) => (p._key === key ? { ...p, [field]: value } : p)),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/areas');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Nueva Área</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre del área"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            error={errors.nombre}
                        />
                        <Input
                            label="Sigla"
                            value={data.sigla}
                            onChange={(e) => setData('sigla', e.target.value)}
                            error={errors.sigla}
                            placeholder="Ej: ADM"
                        />
                    </div>
                    <div className="max-w-lg">
                        <Select
                            label="Área padre"
                            placeholder="Seleccione un área padre"
                            options={[
                                { value: '', label: '— Ninguna (área raíz) —' },
                                ...buildTreeOptions(allAreas),
                            ]}
                            value={String(data.parent_id ?? '')}
                            onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : null)}
                            error={errors.parent_id as string}
                        />
                    </div>
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
                    <div className="max-w-xs">
                        <Select
                            label="Estado"
                            value={data.estado ? '1' : '0'}
                            onChange={(e) => setData('estado', e.target.value === '1')}
                            options={[
                                { value: '1', label: 'Activo' },
                                { value: '0', label: 'Inactivo' },
                            ]}
                        />
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
                                No hay puestos agregados. Puedes agregarlos ahora o después desde la vista del área.
                            </p>
                        )}

                        <div className="space-y-3">
                            {data.puestos.map((puesto, idx) => (
                                <div
                                    key={puesto._key}
                                    className="flex gap-3 items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="flex-1 space-y-2">
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
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Sigla del puesto"
                                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                            value={puesto.sigla}
                                            onChange={(e) => updatePuesto(puesto._key, 'sigla', e.target.value)}
                                        />
                                        {errors[`puestos.${idx}.sigla`] && (
                                            <p className="text-xs text-patuju-red mt-1">{errors[`puestos.${idx}.sigla`]}</p>
                                        )}
                                    </div>
                                    <div className="w-28 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Descripción"
                                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                            value={puesto.descripcion}
                                            onChange={(e) => updatePuesto(puesto._key, 'descripcion', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <select
                                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                            value={puesto.estado ? '1' : '0'}
                                            onChange={(e) => updatePuesto(puesto._key, 'estado', e.target.value === '1')}
                                        >
                                            <option value="1">Activo</option>
                                            <option value="0">Inactivo</option>
                                        </select>
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
                        <Button type="submit" loading={processing}>Guardar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
