import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Funcionario, Area } from '@/types/generated/Tramite';

interface EditProps {
    funcionario: Funcionario;
    areas: { data: Area[] };
}

export default function FuncionariosEdit({ funcionario, areas }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: funcionario.nombre,
        apellidos: funcionario.apellidos ?? '',
        email: funcionario.email ?? '',
        direccion: funcionario.direccion ?? '',
        nro_telefono: funcionario.nro_telefono ?? '',
        cedula_identidad: funcionario.cedula_identidad ?? '',
        tipo_funcionario: funcionario.tipo_funcionario,
        nivel: funcionario.nivel ?? '',
        area_id: String(funcionario.area?.id ?? ''),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/funcionarios/${funcionario.id}`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Editar Funcionario</h2>

            <Card>
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
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
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
                            label="Cédula de Identidad"
                            value={data.cedula_identidad}
                            onChange={(e) => setData('cedula_identidad', e.target.value)}
                            error={errors.cedula_identidad}
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
                        <Input
                            label="Nivel"
                            value={data.nivel}
                            onChange={(e) => setData('nivel', e.target.value)}
                            error={errors.nivel}
                        />
                        <Select
                            label="Área"
                            placeholder="Seleccione un área"
                            options={(areas.data ?? []).map((a) => ({ value: String(a.id), label: a.nombre }))}
                            value={data.area_id}
                            onChange={(e) => setData('area_id', e.target.value)}
                            error={errors.area_id}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-patuju-green">Dirección</label>
                        <textarea
                            rows={2}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                            value={data.direccion}
                            onChange={(e) => setData('direccion', e.target.value)}
                        />
                        {errors.direccion && <p className="text-xs text-patuju-red mt-1">{errors.direccion}</p>}
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
