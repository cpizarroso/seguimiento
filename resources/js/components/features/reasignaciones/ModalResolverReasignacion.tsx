import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Reasignacion } from '@/types/reasignaciones';

export type AccionResolucion = 'aprobar' | 'rechazar';

interface ModalResolverReasignacionProps {
    open: boolean;
    onClose: () => void;
    reasignacion: Reasignacion | null;
    accion: AccionResolucion;
    onConfirmar: (glosa: string) => void;
}

export function ModalResolverReasignacion({
    open,
    onClose,
    reasignacion,
    accion,
    onConfirmar,
}: ModalResolverReasignacionProps) {
    const form = useForm({ glosa_respuesta: '' });

    if (!reasignacion) {
        return null;
    }

    const aprobando = accion === 'aprobar';

    const cerrar = () => {
        form.reset();
        form.clearErrors();
        onClose();
    };

    const enviar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!aprobando && form.data.glosa_respuesta.trim().length < 5) {
            form.setError('glosa_respuesta', 'Indica el motivo del rechazo.');
            return;
        }

        onConfirmar(form.data.glosa_respuesta.trim());
    };

    return (
        <Modal
            open={open}
            onClose={cerrar}
            title={aprobando ? 'Aprobar reasignación' : 'Rechazar reasignación'}
        >
            <form onSubmit={enviar} className="space-y-4">
                <div className="rounded-md border border-excel-border bg-excel-surface-2 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
                    <p className="font-semibold text-excel-text dark:text-gray-100">
                        {reasignacion.tramite?.numero_completo ?? 'Trámite'}
                    </p>
                    <p className="mt-1 text-excel-muted dark:text-gray-400">
                        Solicitante: {reasignacion.solicitante?.name ?? '—'}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-excel-muted dark:text-gray-400">
                        Motivo: {reasignacion.motivo}
                    </p>
                </div>

                <p className="text-sm text-excel-muted dark:text-gray-400">
                    {aprobando
                        ? 'Al aprobar se creará una derivación recepcionada al solicitante y el trámite quedará en proceso.'
                        : 'El trámite no cambiará de responsable. El solicitante verá el motivo del rechazo.'}
                </p>

                <div>
                    <label
                        htmlFor="glosa-resolucion"
                        className="mb-1.5 block text-xs font-semibold text-excel-text dark:text-gray-200"
                    >
                        {aprobando ? 'Comentario (opcional)' : 'Motivo del rechazo'}
                        {!aprobando && <span className="ml-0.5 text-excel-red" aria-hidden="true">*</span>}
                    </label>
                    <textarea
                        id="glosa-resolucion"
                        rows={3}
                        value={form.data.glosa_respuesta}
                        onChange={(event) => form.setData('glosa_respuesta', event.target.value)}
                        placeholder={aprobando ? 'Se agrega a la glosa de la derivación.' : 'Explica por qué se rechaza.'}
                        className={`block w-full rounded-md border bg-excel-surface px-3 py-2 text-sm text-excel-text shadow-sm transition-colors placeholder:text-excel-muted/70 focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                            form.errors.glosa_respuesta
                                ? 'border-excel-red'
                                : 'border-excel-border-strong dark:border-gray-600'
                        }`}
                    />
                    {form.errors.glosa_respuesta && (
                        <p className="mt-1 text-xs text-excel-red">{form.errors.glosa_respuesta}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={cerrar}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant={aprobando ? 'primary' : 'danger'}>
                        {aprobando ? 'Aprobar y asignar' : 'Rechazar solicitud'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
