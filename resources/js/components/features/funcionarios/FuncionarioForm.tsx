import type { UseFormReturn } from '@inertiajs/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Area, Puesto } from '@/types/generated/Tramite';

type FormType = ReturnType<UseFormReturn<Record<string, string>>>;

interface FuncionarioFormProps {
    form: FormType;
    areas?: { data: Area[] };
    puestos?: { data: Puesto[] };
    isEditing?: boolean;
    submitUrl: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function FuncionarioForm({ form, areas, puestos, isEditing, submitUrl, onSuccess, onCancel }: FuncionarioFormProps) {
    const { data, setData, post, put, processing, errors } = form;
    const method = isEditing ? put : post;

    const puestosFiltrados = useMemo(
        () => (data.area_id ? (puestos?.data ?? []).filter((p) => p.area_id === Number(data.area_id)) : (puestos?.data ?? [])),
        [data.area_id, puestos?.data],
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        method(submitUrl, onSuccess ? { onSuccess } : undefined);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Los campos marcados con <span className="text-patuju-red font-semibold">*</span> son obligatorios.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Cédula de Identidad"
                    required
                    value={data.cedula_identidad}
                    onChange={(e) => setData('cedula_identidad', e.target.value)}
                    error={errors.cedula_identidad}
                />
                <Input
                    label="Nombre"
                    required
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    error={errors.nombre}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Apellidos"
                    required
                    value={data.apellidos}
                    onChange={(e) => setData('apellidos', e.target.value)}
                    error={errors.apellidos}
                />
                <Input
                    label="Nro. Teléfono"
                    value={data.nro_telefono}
                    onChange={(e) => setData('nro_telefono', e.target.value)}
                    error={errors.nro_telefono}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />
                <Select
                    label="Tipo de Funcionario"
                    options={[
                        { value: 'contrato', label: 'Contrato' },
                        { value: 'item', label: 'Item' },
                    ]}
                    value={data.tipo_funcionario}
                    onChange={(e) => setData('tipo_funcionario', e.target.value)}
                    error={errors.tipo_funcionario}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                    label="Área"
                    required
                    placeholder="Seleccione un área"
                    options={(areas?.data ?? []).map((a) => ({ value: String(a.id), label: a.nombre }))}
                    value={data.area_id}
                    onChange={(e) => setData('area_id', e.target.value)}
                    error={errors.area_id}
                />
                <Select
                    label="Puesto"
                    required
                    placeholder={data.area_id ? 'Seleccione un puesto' : 'Seleccione un área primero'}
                    options={puestosFiltrados.map((p) => ({ value: String(p.id), label: `${p.nombre} (${p.sigla})` }))}
                    value={data.puesto_id}
                    onChange={(e) => setData('puesto_id', e.target.value)}
                    error={errors.puesto_id}
                    disabled={!data.area_id}
                />
            </div>

            <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Dirección</label>
                <textarea
                    id="direccion"
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                    value={data.direccion}
                    onChange={(e) => setData('direccion', e.target.value)}
                />
                {errors.direccion && <p className="text-xs text-patuju-red mt-1">{errors.direccion}</p>}
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" loading={processing}>
                    {isEditing ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : window.history.back())}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}