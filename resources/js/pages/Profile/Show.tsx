import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';

interface AreaInfo {
    id: number;
    nombre: string;
    sigla: string;
}

interface PuestoInfo {
    id: number;
    nombre: string;
    sigla: string;
    area_id: number;
    area: AreaInfo | null;
}

interface PuestoActivoData {
    id: number;
    puesto_id: number;
    puesto: PuestoInfo | null;
}

interface HistorialPuestoRow {
    id: number;
    puesto_id: number;
    puesto: PuestoInfo | null;
    fecha_inicio: string;
    fecha_fin: string | null;
}

interface FuncionarioData {
    id: number;
    nombre: string;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    profesion: string | null;
    role: string;
    funcionario: FuncionarioData | null;
    puesto_activo: PuestoActivoData | null;
    historial_puestos: HistorialPuestoRow[] | null;
}

interface ProfileProps {
    user: UserProfile;
}

export default function ProfileShow({ user }: ProfileProps) {
    const historialColumns = [
        { key: 'puesto', header: 'Puesto', render: (h: HistorialPuestoRow) => h.puesto?.nombre ?? '—' },
        { key: 'area', header: 'Área', render: (h: HistorialPuestoRow) => h.puesto?.area?.nombre ?? '—' },
        { key: 'fecha_inicio', header: 'Fecha Inicio' },
        {
            key: 'fecha_fin',
            header: 'Fecha Fin',
            render: (h: HistorialPuestoRow) => h.fecha_fin ?? 'Activo',
        },
    ];

    const historial = user.historial_puestos ?? [];

    const [showPasswords, setShowPasswords] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    const passwordType = showPasswords ? 'text' : 'password';
    const toggleBtn = (
        <button
            type="button"
            onClick={() => setShowPasswords((v) => !v)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
            title={showPasswords ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
        >
            {showPasswords ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            )}
        </button>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Mi Perfil</h2>

            <Card>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Nombre</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Teléfono</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.phone ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Profesión</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.profesion ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Rol</dt>
                        <dd>
                            <Badge variant={user.role === 'admin' ? 'primary' : 'secondary'}>
                                {user.role === 'admin' ? 'Admin' : 'Usuario'}
                            </Badge>
                        </dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Funcionario</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.funcionario?.nombre ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between sm:flex-col">
                        <dt className="text-sm text-gray-500 dark:text-gray-400">Puesto Actual</dt>
                        <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.puesto_activo?.puesto
                                ? `${user.puesto_activo.puesto.nombre} (${user.puesto_activo.puesto.area?.nombre ?? '—'})`
                                : '—'}
                        </dd>
                    </div>
                </dl>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-patuju-green mb-4">Historial de Puestos</h3>
                <Table
                    columns={historialColumns}
                    data={historial}
                    keyExtractor={(h) => h.id}
                    emptyMessage="No tiene historial de puestos."
                />
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-patuju-green mb-4">Cambiar Contraseña</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <Input
                        label="Contraseña actual"
                        type={passwordType}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        error={errors.current_password}
                        rightElement={toggleBtn}
                    />
                    <Input
                        label="Nueva contraseña"
                        type={passwordType}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        rightElement={toggleBtn}
                    />
                    <Input
                        label="Confirmar nueva contraseña"
                        type={passwordType}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        rightElement={toggleBtn}
                    />
                    <Button type="submit" loading={processing} className="!bg-patuju-yellow hover:!bg-patuju-yellow/90">
                        Actualizar Contraseña
                    </Button>
                </form>
            </Card>
        </div>
    );
}
