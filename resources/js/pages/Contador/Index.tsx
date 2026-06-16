import { router, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';
import type { ContadorInfo } from '@/types/generated/Tramite';

interface ContadorIndexProps {
    contadores: ContadorInfo[];
}

export default function ContadorIndex({ contadores }: ContadorIndexProps) {
    const [selectedPuesto, setSelectedPuesto] = useState<ContadorInfo | null>(null);
    const reiniciarForm = useForm({ puesto_id: '', glosa: '' });

    const abrirReinicio = (contador: ContadorInfo) => {
        setSelectedPuesto(contador);
        reiniciarForm.setData('puesto_id', String(contador.puesto.id));
        reiniciarForm.setData('glosa', '');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Administrar Contadores</h2>

            <p className="text-sm text-gray-500 dark:text-gray-400">
                Los contadores se reinician automáticamente cada año. Aquí puedes ver el estado actual
                y reiniciar manualmente si es necesario.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contadores.map((item) => (
                    <Card key={item.puesto.id}>
                        <div className="flex flex-col h-full">
                            <h3 className="text-lg font-semibold text-patuju-green">{item.puesto.nombre}</h3>

                            <div className="mt-3 space-y-2 flex-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Año:</span>
                                    <span className="font-medium">{item.contador?.year ?? now()}</span>
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
                <Card>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                        No hay puestos registrados. Crea un puesto primero.
                    </p>
                </Card>
            )}

            <Modal
                open={selectedPuesto !== null}
                onClose={() => setSelectedPuesto(null)}
                title={`Reiniciar Contador - ${selectedPuesto?.puesto.nombre ?? ''}`}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        reiniciarForm.post('/contador/reiniciar', {
                            onSuccess: () => setSelectedPuesto(null),
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
                        <Button type="button" variant="secondary" onClick={() => setSelectedPuesto(null)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

function now(): number {
    return new Date().getFullYear();
}
