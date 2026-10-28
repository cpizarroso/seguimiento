import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/services/userService';

export interface EstadoUsuarioTarget {
    id: number;
    nombre: string;
    username: string;
    activo: boolean;
}

interface EstadoUsuarioModalProps {
    user: EstadoUsuarioTarget;
    onClose: () => void;
}

export function EstadoUsuarioModal({ user, onClose }: EstadoUsuarioModalProps) {
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activar = !user.activo;

    const confirmar = () => {
        setProcesando(true);
        setError(null);

        userService.cambiarEstado(user.id, activar, {
            onSuccess: () => onClose(),
            onError: (errores) => setError(errores.activo ?? 'No se pudo actualizar el estado del usuario.'),
            onFinish: () => setProcesando(false),
        });
    };

    return (
        <Modal open title={activar ? 'Activar usuario' : 'Desactivar usuario'} onClose={onClose} maxWidth="md">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-excel-border bg-excel-surface-2 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-excel-text dark:text-gray-100">{user.nombre}</p>
                        <p className="text-xs text-excel-muted dark:text-gray-400">@{user.username}</p>
                    </div>
                    <Badge variant={user.activo ? 'success' : 'danger'}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                </div>

                <div className="flex items-start gap-2 rounded-md border border-excel-blue/30 bg-excel-blue/5 p-2.5 text-xs leading-relaxed text-excel-muted dark:border-excel-blue/40 dark:text-gray-300">
                    <Icon name="info" size={15} className="mt-0.5 flex-shrink-0 text-excel-blue" />
                    <p>
                        {activar
                            ? 'Al activar la cuenta, el usuario podrá volver a iniciar sesión con su contraseña actual.'
                            : 'Al desactivar la cuenta, el usuario no podrá iniciar sesión y se cerrarán sus sesiones abiertas y tokens API.'}
                    </p>
                </div>

                {error && <p className="text-xs text-excel-red">{error}</p>}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant={activar ? 'primary' : 'danger'}
                        loading={procesando}
                        onClick={confirmar}
                    >
                        <Icon name={activar ? 'unlock' : 'lock'} size={14} />
                        {activar ? 'Activar' : 'Desactivar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
