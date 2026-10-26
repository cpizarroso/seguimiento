import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';
import { backupService } from '@/services/backupService';
import { formatearMb } from './formato';
import type { Backup } from '@/types/backups';

interface Props {
    backup: Backup;
    onClose: () => void;
}

export function ModalRestaurar({ backup, onClose }: Props) {
    const form = useForm({
        confirmacion: '',
        password: '',
    });

    const confirmado = form.data.confirmacion === 'RESTAURAR' && form.data.password.length >= 1;

    const enviar = () => {
        form.post(backupService.urls.restaurar(backup.id), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <Modal open title="Restaurar base de datos" onClose={onClose} maxWidth="lg">
            <form
                className="space-y-4"
                onSubmit={(evento) => {
                    evento.preventDefault();
                    enviar();
                }}
            >
                <div className="flex items-start gap-3 rounded-md border border-excel-red/30 bg-[#fdecea] p-3 text-excel-red dark:bg-excel-red/10">
                    <Icon name="warning" size={18} className="mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 text-xs leading-relaxed">
                        <p className="text-sm font-semibold">Se perderán todos los datos actuales</p>
                        <p>
                            La base de datos se reemplazará por completo con el contenido de{' '}
                            <span className="font-mono">{backup.nombre}</span> ({formatearMb(backup.tamano_mb)}). Antes
                            se creará una copia de seguridad automática por si necesita volver atrás.
                        </p>
                    </div>
                </div>

                <div className="rounded-md bg-excel-surface-2 px-3 py-2 text-xs text-excel-muted dark:bg-gray-700/60">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                        <span>Fecha: {backup.creado_en ?? '—'}</span>
                        <span>Autor: {backup.autor ?? 'Sistema'}</span>
                    </div>
                </div>

                <Input
                    label="Escriba RESTAURAR para confirmar"
                    value={form.data.confirmacion}
                    onChange={(evento) => form.setData('confirmacion', evento.target.value)}
                    placeholder="RESTAURAR"
                    autoFocus
                    autoComplete="off"
                    error={form.errors.confirmacion}
                />

                <Input
                    label="Contraseña de su usuario"
                    type="password"
                    value={form.data.password}
                    onChange={(evento) => form.setData('password', evento.target.value)}
                    autoComplete="current-password"
                    error={form.errors.password}
                />

                <div className="flex justify-end gap-2 border-t border-excel-border pt-3 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={form.processing}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        loading={form.processing}
                        disabled={!confirmado}
                    >
                        Restaurar base de datos
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
