import type { UseFormReturn } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Area } from '@/types/generated/Tramite';

type FormType = ReturnType<UseFormReturn<Record<string, string>>>;

interface FuncionarioFormProps {
    form: FormType;
    areas: { data: Area[] };
    isEditing?: boolean;
    submitUrl: string;
}

export function FuncionarioForm({ form, areas, isEditing, submitUrl }: FuncionarioFormProps) {
    const { data, setData, post, put, processing, errors } = form;
    const method = isEditing ? put : post;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        method(submitUrl);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Nombre"
                    value={data.nombre}
                    onChange={(e) => setData('nombre', e.target.value)}
                    error={errors.nombre}
                />
                <Input
                    label="Apellidos"
                    value={data.apellidos}
                    onChange={(e) => setData('apellidos', e.target.value)}
                    error={errors.apellidos}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Cédula de Identidad xxx"
                    value={data.cedula_identidad}
                    onChange={(e) => setData('cedula_identidad', e.target.value)}
                    error={errors.cedula_identidad}
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
                    placeholder="Seleccione un área"
                    options={(areas.data ?? []).map((a) => ({ value: String(a.id), label: a.nombre }))}
                    value={data.area_id}
                    onChange={(e) => setData('area_id', e.target.value)}
                    error={errors.area_id}
                />
                <Input
                    label="Nivel"
                    value={data.nivel}
                    onChange={(e) => setData('nivel', e.target.value)}
                    error={errors.nivel}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Fecha de Ingreso"
                    type="date"
                    value={data.fecha_ingreso}
                    onChange={(e) => setData('fecha_ingreso', e.target.value)}
                    error={errors.fecha_ingreso}
                />
                <Select
                    label="Estado"
                    options={[
                        { value: 'activo', label: 'Activo' },
                        { value: 'inactivo', label: 'Inactivo' },
                        { value: 'baja', label: 'Baja' },
                    ]}
                    value={data.estado}
                    onChange={(e) => setData('estado', e.target.value)}
                    error={errors.estado}
                />
            </div>

            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Descripción</label>
                <textarea
                    id="descripcion"
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
                <Button type="button" variant="secondary" onClick={() => window.history.back()}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
