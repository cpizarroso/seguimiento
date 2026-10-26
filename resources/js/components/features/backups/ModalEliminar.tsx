import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatearMb, etiquetaTipo } from './formato';
import type { Backup } from '@/types/backups';

interface Props {
    backup: Backup;
    onCerrar: () => void;
    onConfirmar: (backup: Backup) => void;
}

export function ModalEliminar({ backup, onCerrar, onConfirmar }: Props) {
    const [enviando, setEnviando] = useState(false);

    const confirmar = () => {
        setEnviando(true);
        onConfirmar(backup);
    };

    const esPreRestauracion = backup.tipo === 'pre_restauracion';

    return (
        <Modal open title="Eliminar backup" onClose={onCerrar} maxWidth="md">
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-md border border-excel-red/30 bg-[#fdecea] p-3 text-excel-red dark:bg-excel-red/10">
                    <Icon name="warning" size={18} className="mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-xs leading-relaxed">
                        <p className="text-sm font-semibold">Esta acción no se puede deshacer</p>
                        <p>
                            Se eliminará el archivo <span className="font-mono">{backup.nombre}</span> (
                            {formatearMb(backup.tamano_mb)}) y su registro.
                        </p>
                        {esPreRestauracion && (
                            <p className="font-semibold">
                                Es una copia pre-restauración: puede ser su única vía de retorno si la última
                                restauración falló.
                            </p>
                        )}
                    </div>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs text-excel-muted">
                    <div>
                        <dt>Tipo</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">{etiquetaTipo[backup.tipo]}</dd>
                    </div>
                    <div>
                        <dt>Creado</dt>
                        <dd className="font-semibold text-excel-text dark:text-gray-200">{backup.creado_en ?? '—'}</dd>
                    </div>
                </dl>

                <div className="flex justify-end gap-2 border-t border-excel-border pt-3 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onCerrar} disabled={enviando}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="danger" onClick={confirmar} loading={enviando}>
                        Eliminar definitivamente
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
