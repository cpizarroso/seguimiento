import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';

interface ReporteAccesoModalProps {
    titulo?: string;
    mensaje: ReactNode;
    reporte: string;
    onClose: () => void;
}

/**
 * Reporte de acceso copiable que se entrega al usuario después de crear o
 * resetear su contraseña.
 */
export function ReporteAccesoModal({
    titulo = 'Acceso generado',
    mensaje,
    reporte,
    onClose,
}: ReporteAccesoModalProps) {
    const [copiado, setCopiado] = useState(false);

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(reporte);
            setCopiado(true);
        } catch {
            setCopiado(false);
        }
    };

    return (
        <Modal open title={titulo} onClose={onClose} maxWidth="lg">
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border border-excel-green/30 bg-excel-green-light/60 p-3 dark:border-excel-green/40 dark:bg-excel-green/10">
                    <Icon name="check" size={18} className="mt-0.5 flex-shrink-0 text-excel-green dark:text-[#6fd394]" />
                    <p className="text-xs leading-relaxed text-excel-text dark:text-gray-200">{mensaje}</p>
                </div>

                <pre
                    aria-label="Reporte de acceso"
                    className="whitespace-pre-wrap rounded-md border border-excel-border-strong bg-excel-surface-2 p-3 font-mono text-xs leading-relaxed text-excel-text dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                >
                    {reporte}
                </pre>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={copiar}>
                        <Icon name={copiado ? 'check' : 'document'} size={14} />
                        {copiado ? 'Copiado' : 'Copiar reporte'}
                    </Button>
                    <Button type="button" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </Modal>
    );
}
