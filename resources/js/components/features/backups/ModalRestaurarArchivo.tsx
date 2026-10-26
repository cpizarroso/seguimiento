import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { backupService } from '@/services/backupService';

interface Props {
    limiteMb: number;
    onClose: () => void;
}

export function ModalRestaurarArchivo({ limiteMb, onClose }: Props) {
    const form = useForm<{ archivo: File | null; confirmacion: string; password: string }>({
        archivo: null,
        confirmacion: '',
        password: '',
    });

    const confirmado =
        form.data.archivo !== null && form.data.confirmacion === 'RESTAURAR' && form.data.password.length >= 1;

    const enviar = () => {
        form.post(backupService.urls.restaurarArchivo, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <Modal open title="Restaurar desde un archivo" onClose={onClose} maxWidth="lg">
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
                            El archivo se validará y se archivará como copia protegida antes de reemplazar la base de
                            datos. Formatos admitidos: <span className="font-mono">.sql</span> y{' '}
                            <span className="font-mono">.sql.gz</span> (máximo {limiteMb} MB).
                        </p>
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="archivo-backup"
                        className="mb-1.5 block text-xs font-semibold text-excel-text dark:text-gray-200"
                    >
                        Archivo de backup <span className="text-excel-red">*</span>
                    </label>
                    <input
                        id="archivo-backup"
                        type="file"
                        accept=".sql,.gz,application/gzip,text/plain"
                        onChange={(evento) => form.setData('archivo', evento.target.files?.[0] ?? null)}
                        className="block w-full cursor-pointer rounded-md border border-excel-border-strong bg-excel-surface text-xs text-excel-muted file:mr-3 file:cursor-pointer file:rounded-l-md file:border-0 file:bg-excel-surface-2 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-excel-text focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-100"
                    />
                    {form.data.archivo && (
                        <p className="mt-1 text-[11px] text-excel-muted">
                            {form.data.archivo.name} ({(form.data.archivo.size / 1048576).toFixed(2)} MB)
                        </p>
                    )}
                    {form.errors.archivo && <p className="mt-1 text-xs text-excel-red">{form.errors.archivo}</p>}
                </div>

                <Input
                    label="Escriba RESTAURAR para confirmar"
                    value={form.data.confirmacion}
                    onChange={(evento) => form.setData('confirmacion', evento.target.value)}
                    placeholder="RESTAURAR"
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
                    <Button type="submit" variant="danger" loading={form.processing} disabled={!confirmado}>
                        Importar y restaurar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
