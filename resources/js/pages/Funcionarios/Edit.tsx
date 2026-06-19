import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { FuncionarioForm } from '@/components/features/funcionarios/FuncionarioForm';
import type { Funcionario, Area } from '@/types/generated/Tramite';

interface EditProps {
    funcionario: Funcionario;
    areas: { data: Area[] };
}

export default function FuncionariosEdit({ funcionario, areas }: EditProps) {
    const form = useForm({
        nombre: funcionario.nombre,
        apellidos: funcionario.apellidos ?? '',
        email: funcionario.email ?? '',
        direccion: funcionario.direccion ?? '',
        nro_telefono: funcionario.nro_telefono ?? '',
        cedula_identidad: funcionario.cedula_identidad ?? '',
        tipo_funcionario: funcionario.tipo_funcionario,
        nivel: funcionario.nivel ?? '',
        fecha_ingreso: funcionario.fecha_ingreso ?? '',
        estado: funcionario.estado ?? 'activo',
        area_id: String(funcionario.area?.id ?? ''),
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Editar Funcionario</h2>
            <Card>
                <FuncionarioForm form={form} areas={areas} isEditing submitUrl={`/funcionarios/${funcionario.id}`} />
            </Card>
        </div>
    );
}
