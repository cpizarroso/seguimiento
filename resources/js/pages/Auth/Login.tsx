import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-patuju-white dark:bg-gray-900">
            <Card padding="lg" className="w-full max-w-md">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-patuju-green">Seguimiento de Trámites</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Inicia sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        autoFocus
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                    />
                    <Button type="submit" loading={processing} className="w-full" size="lg">
                        Iniciar sesión
                    </Button>
                </form>
            </Card>
        </div>
    );
}
