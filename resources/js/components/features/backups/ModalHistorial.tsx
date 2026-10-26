import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { etiquetaAccion } from './formato';
import type { Backup, EventoBackup } from '@/types/backups';

interface Props {
    backup: Backup;
    eventos: EventoBackup[];
    cargando: boolean;
    error: string | null;
    onCerrar: () => void;
}

const varianteAccion: Record<string, 'default' | 'success' | 'danger' | 'info' | 'warning'> = {
    creacion: 'success',
    restauracion: 'warning',
    eliminacion: 'danger',
    fallo: 'danger',
    descarga: 'info',
    carga_externa: 'info',
};

export function ModalHistorial({ backup, eventos, cargando, error, onCerrar }: Props) {
    return (
        <Modal open title={`Historial · ${backup.nombre}`} onClose={onCerrar} maxWidth="2xl">
            {cargando ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-excel-muted">
                    <Icon name="refresh" size={16} className="animate-spin" />
                    Cargando historial…
                </div>
            ) : error ? (
                <div className="rounded-md border border-excel-red/30 bg-[#fdecea] p-3 text-sm text-excel-red dark:bg-excel-red/10">
                    {error}
                </div>
            ) : eventos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-excel-muted">
                    <Icon name="history" size={26} />
                    No hay eventos registrados para este backup.
                </div>
            ) : (
                <ul className="space-y-2">
                    {eventos.map((evento) => (
                        <li
                            key={evento.id}
                            className="rounded-md border border-excel-border bg-excel-surface px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant={varianteAccion[evento.accion] ?? 'default'}>
                                        {etiquetaAccion[evento.accion] ?? evento.accion}
                                    </Badge>
                                    <span className="text-xs font-semibold text-excel-text dark:text-gray-200">
                                        {evento.usuario}
                                    </span>
                                    {evento.ip && <span className="text-[11px] text-excel-muted">IP {evento.ip}</span>}
                                </div>
                                <span className="text-[11px] text-excel-muted">{evento.fecha ?? '—'}</span>
                            </div>
                            {evento.detalle && (
                                <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-excel-muted">
                                    {evento.detalle}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
}
