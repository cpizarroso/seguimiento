import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Puesto } from '@/types/generated/Tramite';

interface CreateProps {
    puestos: Puesto[];
}

export default function TramitesCreate({ puestos }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        fecha: '',
        descripcion: '',
        numero_diamante: '',
        glosa: '',
        puesto_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tramites');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Nuevo Trámite</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Fecha"
                            type="date"
                            value={data.fecha}
                            onChange={(e) => setData('fecha', e.target.value)}
                            error={errors.fecha}
                        />

                        <Select
                            label="Puesto (para numeración)"
                            placeholder="Seleccione un puesto"
                            options={puestos.map((p) => ({ value: String(p.id), label: p.nombre }))}
                            value={data.puesto_id}
                            onChange={(e) => setData('puesto_id', e.target.value)}
                            error={errors.puesto_id}
                        />

                        <div className="sm:col-span-2">
                            <label htmlFor="descripcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Descripción</label>
                            <textarea
                                id="descripcion"
                                rows={4}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                            />
                            {errors.descripcion && <p className="text-xs text-patuju-red">{errors.descripcion}</p>}
                        </div>

                        <Input
                            label="Número Diamante"
                            value={data.numero_diamante}
                            onChange={(e) => setData('numero_diamante', e.target.value)}
                            error={errors.numero_diamante}
                            placeholder="Opcional"
                        />

                        <div className="sm:col-span-2">
                            <label htmlFor="glosa" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">Glosa</label>
                            <textarea
                                id="glosa"
                                rows={3}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                                value={data.glosa}
                                onChange={(e) => setData('glosa', e.target.value)}
                            />
                            {errors.glosa && <p className="text-xs text-patuju-red">{errors.glosa}</p>}
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
