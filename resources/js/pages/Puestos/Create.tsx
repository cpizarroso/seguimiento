import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function PuestosCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/puestos');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Nuevo Puesto</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            error={errors.nombre}
                        />
                        <div className="sm:col-span-2">
                            <label htmlFor="descripcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Descripción</label>
                            <textarea
                                id="descripcion"
                                rows={3}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                            />
                            {errors.descripcion && <p className="text-xs text-patuju-red">{errors.descripcion}</p>}
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
