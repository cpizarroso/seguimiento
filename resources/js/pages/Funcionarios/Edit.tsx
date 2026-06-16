import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import type { Funcionario, Puesto } from '@/types/generated/Tramite';

interface EditProps {
    funcionario: Funcionario;
    puestos: Puesto[];
}

export default function FuncionariosEdit({ funcionario, puestos }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: funcionario.nombre,
        email: funcionario.email ?? '',
        puesto_id: String(funcionario.puesto?.id ?? ''),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/funcionarios/${funcionario.id}`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Editar Funcionario</h2>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            label="Nombre"
                            value={data.nombre}
                            onChange={(e) => setData('nombre', e.target.value)}
                            error={errors.nombre}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                        />
                    </div>

                    <Select
                        label="Puesto de Trabajo"
                        placeholder="Seleccione un puesto"
                        options={puestos.map((p) => ({ value: String(p.id), label: p.nombre }))}
                        value={data.puesto_id}
                        onChange={(e) => setData('puesto_id', e.target.value)}
                        error={errors.puesto_id}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" loading={processing}>Actualizar</Button>
                        <Button type="button" variant="secondary" onClick={() => window.history.back()}>Cancelar</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
