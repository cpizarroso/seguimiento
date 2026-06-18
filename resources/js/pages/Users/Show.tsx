import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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

interface UserShow {
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

interface ShowProps {
    user: UserShow;
}

function generarPassword(name: string): string {
    const first = name.charAt(0).toUpperCase();
    const second = name.charAt(1).toLowerCase();
    const nums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
    const symbols = '!@#$%&*';
    const symbol = symbols.charAt(Math.floor(Math.random() * symbols.length));
    return `${first}${second}${nums}${symbol}`;
}

export default function UsersShow({ user }: ShowProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = () => {
        const pwd = generarPassword(user.name);
        setPassword(pwd);
        setPasswordConfirmation(pwd);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== passwordConfirmation) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 5) {
            setError('La contraseña debe tener al menos 5 caracteres.');
            return;
        }
        setProcessing(true);
        router.put(`/users/${user.id}/reset-password`, {
            password,
            password_confirmation: passwordConfirmation,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setModalOpen(false);
                setPassword('');
                setPasswordConfirmation('');
                setShowPassword(false);
            },
            onError: (errs) => {
                setError(Object.values(errs).join(' '));
            },
            onFinish: () => setProcessing(false),
        });
    };

    const toggleBtn = (
        <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
            {showPassword ? (
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-patuju-green">Usuario</h2>
                <div className="flex gap-2">
                    <Button variant="danger" onClick={() => setModalOpen(true)}>
                        Resetear Contraseña
                    </Button>
                    <Link href={`/users/${user.id}/edit`}>
                        <Button variant="secondary">Editar</Button>
                    </Link>
                    <Link href="/users">
                        <Button variant="secondary">Volver</Button>
                    </Link>
                </div>
            </div>

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

            <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(''); }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Establece una nueva contraseña para <strong>{user.name}</strong>.
                    </p>

                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleGenerate} className="flex-1">
                            Generar
                        </Button>
                    </div>

                    <Input
                        label="Nueva contraseña"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        rightElement={toggleBtn}
                    />
                    <Input
                        label="Confirmar contraseña"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                    />

                    {error && <p className="text-xs text-patuju-red">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setError(''); }}>
                            Cancelar
                        </Button>
                        <Button type="submit" loading={processing}>
                            Guardar
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
