import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { FuncionarioForm } from '@/components/features/funcionarios/FuncionarioForm';
import type { Area } from '@/types/generated/Tramite';

interface CreateProps {
    areas: { data: Area[] };
}

export default function FuncionariosCreate({ areas }: CreateProps) {
    const form = useForm({
        nombre: '',
        apellidos: '',
        email: '',
        direccion: '',
        nro_telefono: '',
        cedula_identidad: '',
        tipo_funcionario: 'contrato',
        nivel: '',
        fecha_ingreso: '',
        estado: 'activo',
        area_id: '',
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Nuevo Funcionario</h2>
            <Card>
                <FuncionarioForm form={form} areas={areas} submitUrl="/funcionarios" />
            </Card>
        </div>
    );
}
