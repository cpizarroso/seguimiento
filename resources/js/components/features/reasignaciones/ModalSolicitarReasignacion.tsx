import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface TramiteSolicitud {
    id: number;
    numero_completo: string;
}

interface ModalSolicitarReasignacionProps {
    open: boolean;
    onClose: () => void;
    tramite: TramiteSolicitud;
    onSuccess?: () => void;
}

export function ModalSolicitarReasignacion({
    open,
    onClose,
    tramite,
    onSuccess,
}: ModalSolicitarReasignacionProps) {
    const form = useForm({
        tramite_id: tramite.id,
        motivo: '',
    });

    const cerrar = () => {
        form.reset();
        form.clearErrors();
        onClose();
    };

    const enviar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (form.data.motivo.trim().length < 5) {
            form.setError('motivo', 'El motivo debe tener al menos 5 caracteres.');
            return;
        }

        form.transform((datos) => ({ ...datos, tramite_id: tramite.id }));
        form.post('/reasignaciones', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onSuccess?.();
                onClose();
            },
        });
    };

    return (
        <Modal
            open={open}
            onClose={cerrar}
            title={`Solicitar reasignación · ${tramite.numero_completo}`}
        >
            <form onSubmit={enviar} className="space-y-4">
                <p className="text-sm text-excel-muted dark:text-gray-400">
                    La solicitud llegará al jefe o administrador. Si la aprueba, el trámite quedará
                    recepcionado a tu nombre y podrás derivarlo a otro usuario.
                </p>

                <div>
                    <label
                        htmlFor="motivo-reasignacion"
                        className="mb-1.5 block text-xs font-semibold text-excel-text dark:text-gray-200"
                    >
                        Motivo
                        <span className="ml-0.5 text-excel-red" aria-hidden="true">*</span>
                    </label>
                    <textarea
                        id="motivo-reasignacion"
                        rows={4}
                        value={form.data.motivo}
                        onChange={(event) => {
                            form.setData('motivo', event.target.value);
                            form.clearErrors('motivo');
                        }}
                        placeholder="Explica por qué necesitas que se te reasigne este trámite."
                        className={`block w-full rounded-md border bg-excel-surface px-3 py-2 text-sm text-excel-text shadow-sm transition-colors placeholder:text-excel-muted/70 focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 ${
                            form.errors.motivo
                                ? 'border-excel-red'
                                : 'border-excel-border-strong dark:border-gray-600'
                        }`}
                    />
                    {form.errors.motivo && (
                        <p className="mt-1 text-xs text-excel-red">{form.errors.motivo}</p>
                    )}
                    {form.errors.tramite_id && (
                        <p className="mt-1 text-xs text-excel-red">{form.errors.tramite_id}</p>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={cerrar}>
                        Cancelar
                    </Button>
                    <Button type="submit" loading={form.processing}>
                        Enviar solicitud
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
