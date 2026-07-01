import { router, useForm, usePage } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { usePermissions } from '@/hooks/usePermissions';
import { useState } from 'react';

interface AreaItem {
    id: number;
    nombre: string;
    sigla: string;
}

interface ContadorData {
    id: number;
    year: number;
    ultimo_numero: number;
    reset_glosa: string | null;
    ultimo_reset_at: string | null;
}

interface ContadorRow {
    area: AreaItem;
    contador: ContadorData | null;
}

interface ConfiguracionIndexProps {
    perPage: number;
    contadores: ContadorRow[];
}

const PER_PAGE_OPTIONS = [
    { value: '5', label: '5 por página' },
    { value: '10', label: '10 por página' },
];

export default function ConfiguracionIndex({ perPage, contadores }: ConfiguracionIndexProps) {
    const perPageForm = useForm({ per_page: String(perPage) });
    const [selectedArea, setSelectedArea] = useState<ContadorRow | null>(null);
    const reiniciarForm = useForm({ area_id: '', glosa: '' });

    const abrirReinicio = (item: ContadorRow) => {
        setSelectedArea(item);
        reiniciarForm.setData('area_id', String(item.area.id));
        reiniciarForm.setData('glosa', '');
    };

    const { can } = usePermissions();
    const esAdmin = can('areas_puestos', 'consulta');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Configuración</h2>

            <Card>
                <h3 className="text-lg font-semibold text-patuju-green mb-4">Paginación</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Define cuántos trámites se muestran por página en la vista de trámites.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        perPageForm.put('/configuracion/per-page', {
                            onSuccess: () => perPageForm.setData('per_page', perPageForm.data.per_page),
                        });
                    }}
                    className="flex items-end gap-4"
                >
                    <div className="w-48">
                        <Select
                            label="Trámites por página"
                            placeholder="Seleccione..."
                            options={PER_PAGE_OPTIONS}
                            value={perPageForm.data.per_page}
                            onChange={(e) => perPageForm.setData('per_page', e.target.value)}
                        />
                    </div>
                    <Button type="submit" loading={perPageForm.processing}>
                        Guardar
                    </Button>
                </form>
            </Card>

            {esAdmin && (
                <Card>
                    <h3 className="text-lg font-semibold text-patuju-green mb-4">Administrador de Contadores</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Cada área tiene su propia secuencia numérica. Los contadores se reinician
                        automáticamente cada año.
                    </p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {contadores.map((item) => (
                            <Card key={item.area.id}>
                                <div className="flex flex-col h-full">
                                    <h4 className="text-lg font-semibold text-patuju-green">{item.area.nombre}</h4>
                                    <p className="text-xs text-gray-400">{item.area.sigla}</p>

                                    <div className="mt-3 space-y-2 flex-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Año:</span>
                                            <span className="font-medium">{item.contador?.year ?? new Date().getFullYear()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Último N°:</span>
                                            <span className="font-medium">{item.contador?.ultimo_numero ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Siguiente N°:</span>
                                            <span className="font-bold text-patuju-green">{(item.contador?.ultimo_numero ?? 0) + 1}</span>
                                        </div>
                                        {item.contador?.ultimo_reset_at && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">Último reinicio:</span>
                                                <span className="font-medium text-xs">{item.contador.ultimo_reset_at}</span>
                                            </div>
                                        )}
                                        {item.contador?.reset_glosa && (
                                            <div className="mt-2 p-2 rounded bg-patuju-yellow/10 dark:bg-patuju-yellow/20 text-xs text-gray-600 dark:text-gray-300">
                                                <span className="font-medium">Glosa de reinicio:</span>
                                                <p>{item.contador.reset_glosa}</p>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="mt-4 w-full"
                                        onClick={() => abrirReinicio(item)}
                                    >
                                        Reiniciar Contador
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {contadores.length === 0 && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                            No hay áreas registradas.
                        </p>
                    )}

                    <Modal
                        open={selectedArea !== null}
                        onClose={() => setSelectedArea(null)}
                        title={`Reiniciar Contador - ${selectedArea?.area.nombre ?? ''}`}
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                reiniciarForm.post('/contador/reiniciar', {
                                    onSuccess: () => setSelectedArea(null),
                                });
                            }}
                            className="space-y-4"
                        >
                            <Input
                                label="Glosa del reinicio"
                                placeholder="Indique el motivo del reinicio..."
                                value={reiniciarForm.data.glosa}
                                onChange={(e) => reiniciarForm.setData('glosa', e.target.value)}
                            />
                            <p className="text-sm text-patuju-red/80">
                                ⚠ Esta acción reiniciará el contador a 0. Los trámites existentes no se verán afectados.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" loading={reiniciarForm.processing} variant="danger">Reiniciar</Button>
                                <Button type="button" variant="secondary" onClick={() => setSelectedArea(null)}>Cancelar</Button>
                            </div>
                        </form>
                    </Modal>
                </Card>
            )}
        </div>
    );
}
