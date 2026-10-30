import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ResumenTramites } from './ResumenTramites';
import type { TramiteResumenDerivacion } from '@/types/derivaciones';

interface ModalRecepcionMasivaProps {
    open: boolean;
    onClose: () => void;
    tramiteIds: number[];
    tramites?: TramiteResumenDerivacion[];
    onSuccess?: () => void;
}

export function ModalRecepcionMasiva({ open, onClose, tramiteIds, tramites, onSuccess }: ModalRecepcionMasivaProps) {
    const esIndividual = tramiteIds.length === 1;
    const titulo = esIndividual ? 'Recepcionar trámite' : 'Recepcionar trámites';
    const leyenda = esIndividual
        ? 'Se recepcionará 1 trámite.'
        : `Se recepcionarán ${tramiteIds.length} trámites.`;

    const form = useForm({
        glosa_recepcion: '',
        tramite_ids: tramiteIds,
    });

    const cerrar = () => {
        form.reset();
        form.clearErrors();
        onClose();
    };

    const enviar = () => {
        form.post('/tramites/recepcionar-varios', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onSuccess?.();
                onClose();
            },
        });
    };

    return (
        <Modal open={open} onClose={cerrar} title={titulo}>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    enviar();
                }}
                className="space-y-4"
            >
                <p className="text-sm text-excel-muted dark:text-gray-300">
                    {leyenda}
                </p>
                {tramites && tramites.length > 0 && <ResumenTramites tramites={tramites} />}
                <div>
                    <label htmlFor="glosa_recepcion_masiva" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                        Glosa de recepción
                    </label>
                    <textarea
                        id="glosa_recepcion_masiva"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        value={form.data.glosa_recepcion}
                        onChange={(event) => form.setData('glosa_recepcion', event.target.value)}
                    />
                    {form.errors.glosa_recepcion && (
                        <p className="mt-1 text-xs text-excel-red">{form.errors.glosa_recepcion}</p>
                    )}
                    {form.errors.tramite_ids && (
                        <p className="mt-1 text-xs text-excel-red">{form.errors.tramite_ids}</p>
                    )}
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="submit" loading={form.processing}>Recepcionar</Button>
                    <Button type="button" variant="secondary" onClick={cerrar}>Cancelar</Button>
                </div>
            </form>
        </Modal>
    );
}
