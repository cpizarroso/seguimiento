import { useForm } from '@inertiajs/react';
import { Modal } from '@/components/ui/Modal';
import { DerivarForm } from './DerivarForm';
import { ResumenTramites } from './ResumenTramites';
import type { DestinatarioDerivacion, TramiteResumenDerivacion } from '@/types/derivaciones';

interface DerivarModalProps {
    open: boolean;
    onClose: () => void;
    destinatarios: DestinatarioDerivacion[];
    submitUrl: string;
    tramiteIds?: number[];
    tramites?: TramiteResumenDerivacion[];
    title?: string;
    onSuccess?: () => void;
}

export function DerivarModal({
    open,
    onClose,
    destinatarios,
    submitUrl,
    tramiteIds,
    tramites,
    title = 'Derivar Trámite',
    onSuccess,
}: DerivarModalProps) {
    const form = useForm({
        area_id: '',
        derivado_a: '',
        glosa_derivacion: '',
        tramite_ids: tramiteIds ?? [],
    });

    const cerrar = () => {
        form.reset();
        form.clearErrors();
        onClose();
    };

    return (
        <Modal open={open} onClose={cerrar} title={title} maxWidth="xl">
            <div className="space-y-4">
                {tramites && tramites.length > 0 && <ResumenTramites tramites={tramites} />}
                <DerivarForm
                    form={form}
                    destinatarios={destinatarios}
                    submitUrl={submitUrl}
                    onCancel={cerrar}
                    onSuccess={() => {
                        form.reset();
                        onSuccess?.();
                        onClose();
                    }}
                />
            </div>
        </Modal>
    );
}
