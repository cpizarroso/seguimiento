import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

const EMAIL_DOMAIN = '@seguimiento.gob.bo';

interface UserEdit {
    id: number;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
    profesion: string | null;
    cargo: string | null;
    role: string;
}

interface EditProps {
    user: UserEdit;
}

export default function UsersEdit({ user }: EditProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [emailLocal, setEmailLocal] = useState(user.email.replace(EMAIL_DOMAIN, ''));
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        username: user.username ?? '',
        phone: user.phone ?? '',
        profesion: user.profesion ?? '',
        cargo: user.cargo ?? '',
        password: '',
        role: user.role,
    });

    const generarPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('password', pwd);
    };

    const handleEmailChange = (value: string) => {
        setEmailLocal(value);
        setData('email', value + EMAIL_DOMAIN);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setData('email', emailLocal + EMAIL_DOMAIN);
        put(`/users/${user.id}`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Editar Usuario</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre Completo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                        <Input
                            label="Email"
                            type="text"
                            value={emailLocal}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            error={errors.email}
                            append={EMAIL_DOMAIN}
                            placeholder="usuario"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Usuario"
                            value={data.username}
                            onChange={(e) => setData('username', e.target.value)}
                            error={errors.username}
                        />
                        <Input
                            label="Teléfono"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            error={errors.phone}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Profesión"
                            value={data.profesion}
                            onChange={(e) => setData('profesion', e.target.value)}
                            error={errors.profesion}
                        />
                        <Input
                            label="Cargo"
                            value={data.cargo}
                            onChange={(e) => setData('cargo', e.target.value)}
                            error={errors.cargo}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Input
                                label="Nueva Contraseña (dejar vacío para mantener)"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                }
                            />
                            <div className="mt-2">
                                <Button type="button" size="sm" variant="secondary" onClick={generarPassword}>
                                    Generar contraseña segura
                                </Button>
                            </div>
                        </div>
                        <Select
                            label="Rol"
                            options={[
                                { value: 'user', label: 'Usuario' },
                                { value: 'admin', label: 'Administrador' },
                            ]}
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            error={errors.role}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={processing}>Actualizar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
