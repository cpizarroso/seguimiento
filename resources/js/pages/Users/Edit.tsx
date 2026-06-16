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
                            label="Nombre"
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
                            label="Nueva contraseña (dejar vacío para mantener)"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                        />
                        <Input
                            label="Confirmar contraseña"
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
