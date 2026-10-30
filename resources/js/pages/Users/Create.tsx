import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ReporteAccesoModal } from '@/components/features/users/ReporteAccesoModal';
import { UserForm } from '@/components/features/users/UserForm';
import type { UsuarioCreado } from '@/components/features/users/UserForm';
import { generarPassword } from '@/components/features/users/passwordReset';
import type { Area, Persona } from '@/types/generated/Tramite';
import type { RolOption, PermisoCatalogo, PermisoOverride } from '@/components/features/users/UserForm';

interface UsersCreateProps {
    roles?: { data: RolOption[] };
    personas?: { data: Persona[] };
    areas?: { data: Area[] };
    permisos?: PermisoCatalogo[];
}

export default function UsersCreate({ roles, personas, areas, permisos }: UsersCreateProps) {
    const [usuarioCreado, setUsuarioCreado] = useState<UsuarioCreado | null>(null);

    const form = useForm(() => ({
        username: '',
        email: '',
        password: generarPassword(),
        persona_id: '',
        role_ids: [] as number[],
        area_ids: [] as number[],
        area_predeterminada_id: '',
        permisos: [] as PermisoOverride[],
    }));

    const cerrarReporte = () => {
        setUsuarioCreado(null);
        router.visit('/users');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-patuju-green">Nuevo usuario</h1>
            <Card>
                <UserForm
                    form={form}
                    roles={roles}
                    personas={personas}
                    areas={areas}
                    permisos={permisos}
                    submitUrl="/users?desde=create"
                    onCreated={setUsuarioCreado}
                    onCancel={() => router.visit('/users')}
                />
            </Card>

            {usuarioCreado && (
                <ReporteAccesoModal
                    titulo="Usuario creado"
                    mensaje={(
                        <>
                            El usuario <strong>{usuarioCreado.nombre}</strong> fue creado. Copia el reporte y
                            entrégalo al usuario junto con su contraseña inicial.
                        </>
                    )}
                    reporte={usuarioCreado.reporte}
                    onClose={cerrarReporte}
                />
            )}
        </div>
    );
}
