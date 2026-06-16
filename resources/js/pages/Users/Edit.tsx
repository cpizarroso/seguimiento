import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';

interface FuncionarioOption {
    id: number;
    nombre: string;
}

interface UserEdit {
    id: number;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
    profesion: string | null;
    cargo: string | null;
    role: string;
    funcionario: FuncionarioOption | null;
}

interface EditProps {
    user: UserEdit;
    funcionarios: FuncionarioOption[];
}

export default function UsersEdit({ user, funcionarios }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        username: user.username ?? '',
        phone: user.phone ?? '',
        profesion: user.profesion ?? '',
        cargo: user.cargo ?? '',
        password: '',
        password_confirmation: '',
        role: user.role,
        funcionario_id: String(user.funcionario?.id ?? ''),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
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
                            label="Número de Teléfono"
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
                        <Input
                            label="Nueva Contraseña (dejar vacío para mantener)"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <Select
                            label="Funcionario (opcional)"
                            placeholder="Seleccione un funcionario"
                            options={funcionarios.map((f) => ({ value: String(f.id), label: f.nombre }))}
                            value={data.funcionario_id}
                            onChange={(e) => setData('funcionario_id', e.target.value)}
                            error={errors.funcionario_id}
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
