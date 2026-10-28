import { useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { userService } from '@/services/userService';
import { ReporteAccesoModal } from './ReporteAccesoModal';
import { SugerenciasContrasena } from './SugerenciasContrasena';
import { MINIMO_PASSWORD, construirReporteAcceso, generarPassword } from './passwordReset';

export interface ResetPasswordTarget {
    id: number;
    nombre: string;
    username: string;
    nombres: string;
    apellidos: string;
    ci: string | null;
    cargo: string | null;
    area: string | null;
}

interface PuestoResumen {
    puesto?: { nombre?: string | null } | null;
}

interface PersonaResumen {
    nombres?: string | null;
    apellidos?: string | null;
    nombre_completo?: string | null;
    ci?: string | null;
    area?: { nombre?: string | null; codigo?: string | null } | null;
    puesto_activo?: PuestoResumen | null;
}

interface UsuarioResumen {
    id: number;
    name?: string | null;
    username: string;
    persona?: PersonaResumen | null;
    puesto_activo?: PuestoResumen | null;
}

/**
 * Normaliza las distintas formas del payload de usuario (index, edit, show)
 * a los datos planos que necesita el modal.
 */
export function resetPasswordTarget(user: UsuarioResumen): ResetPasswordTarget {
    const persona = user.persona ?? null;
    const puesto = user.puesto_activo ?? persona?.puesto_activo ?? null;
    const area = persona?.area ?? null;

    return {
        id: user.id,
        nombre: user.name ?? persona?.nombre_completo ?? user.username,
        username: user.username,
        nombres: persona?.nombres ?? '',
        apellidos: persona?.apellidos ?? '',
        ci: persona?.ci ?? null,
        cargo: puesto?.puesto?.nombre ?? null,
        area: area?.nombre ? [area.codigo, area.nombre].filter(Boolean).join(' · ') : null,
    };
}

interface ResetPasswordModalProps {
    user: ResetPasswordTarget;
    onClose: () => void;
}

export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
    const [reporte, setReporte] = useState<string | null>(null);

    const form = useForm(() => ({ password: generarPassword() }));

    const guardar = (evento: FormEvent) => {
        evento.preventDefault();

        userService.resetPassword(user.id, {
            password: form.data.password,
            password_confirmation: form.data.password,
        }, {
            onSuccess: () => {
                setReporte(construirReporteAcceso({
                    nombre: user.nombre,
                    cargo: user.cargo,
                    area: user.area,
                    username: user.username,
                }, form.data.password));
            },
        });
    };

    if (reporte !== null) {
        return (
            <ReporteAccesoModal
                titulo="Contraseña actualizada"
                mensaje={(
                    <>
                        La contraseña de <strong>{user.nombre}</strong> se actualizó. Copia el reporte y
                        entrégalo al usuario.
                    </>
                )}
                reporte={reporte}
                onClose={onClose}
            />
        );
    }

    return (
        <Modal open title="Resetear contraseña" onClose={onClose} maxWidth="lg">
            <form className="space-y-4" onSubmit={guardar}>
                <div className="rounded-md border border-excel-border bg-excel-surface-2 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <p className="text-sm font-semibold text-excel-text dark:text-gray-100">{user.nombre}</p>
                    <p className="text-xs text-excel-muted dark:text-gray-400">
                        @{user.username} · {user.cargo ?? 'Sin cargo'} · {user.area ?? 'Sin área'}
                    </p>
                </div>

                <div className="flex items-start gap-2 rounded-md border border-excel-blue/30 bg-excel-blue/5 p-2.5 text-xs leading-relaxed text-excel-muted dark:border-excel-blue/40 dark:text-gray-300">
                    <Icon name="warning" size={15} className="mt-0.5 flex-shrink-0 text-excel-blue" />
                    <p>Al guardar se revocan los tokens API del usuario. La nueva contraseña no se vuelve a mostrar.</p>
                </div>

                <SugerenciasContrasena
                    value={form.data.password}
                    onChange={(valor) => {
                        form.setData('password', valor);
                        form.clearErrors('password');
                    }}
                    nombres={user.nombres}
                    apellidos={user.apellidos}
                    ci={user.ci}
                    error={form.errors.password}
                    required
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button
                        type="submit"
                        loading={form.processing}
                        disabled={form.data.password.length < MINIMO_PASSWORD}
                    >
                        Guardar
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
