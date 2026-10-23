import { useForm } from '@inertiajs/react';
import { useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { AreaTreeNode, Puesto } from '@/types/generated/Tramite';

interface PuestoFormModalProps {
    open: boolean;
    onClose: () => void;
    area: AreaTreeNode | null;
    puesto?: Puesto | null;
}

export function PuestoFormModal({ open, onClose, area, puesto }: PuestoFormModalProps) {
    const form = useForm({
        nombre: '',
        codigo: '',
        descripcion: '',
        activo: true,
    });

    useEffect(() => {
        if (!open) return;

        form.setData({
            nombre: puesto?.nombre ?? '',
            codigo: puesto?.codigo ?? '',
            descripcion: puesto?.descripcion ?? '',
            activo: puesto?.activo ?? true,
        });
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, puesto?.id, area?.id]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!area) return;

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (puesto) {
            form.put(`/areas/${area.id}/puestos/${puesto.id}`, options);
        } else {
            form.post(`/areas/${area.id}/puestos`, options);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={puesto ? 'Editar puesto' : 'Nuevo puesto'}
            maxWidth="lg"
        >
            <form onSubmit={submit} className="space-y-4">
                {area && (
                    <p className="text-sm text-gray-500">
                        Área: <span className="font-medium text-patuju-green">{area.nombre}</span>
                    </p>
                )}

                <Input
                    label="Nombre"
                    required
                    value={form.data.nombre}
                    onChange={(event) => form.setData('nombre', event.target.value.toUpperCase())}
                    error={form.errors.nombre}
                    placeholder="PROFESIONAL"
                />

                <Input
                    label="Código"
                    value={form.data.codigo}
                    onChange={(event) => form.setData('codigo', event.target.value.toUpperCase())}
                    error={form.errors.codigo}
                    placeholder="Se genera automáticamente si se deja vacío"
                />

                <div>
                    <label className="mb-1 block text-sm font-medium text-patuju-green">Descripción</label>
                    <textarea
                        value={form.data.descripcion}
                        onChange={(event) => form.setData('descripcion', event.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                        type="checkbox"
                        checked={form.data.activo}
                        onChange={(event) => form.setData('activo', event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-patuju-green focus:ring-patuju-green"
                    />
                    Puesto activo
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando...' : puesto ? 'Actualizar puesto' : 'Crear puesto'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
