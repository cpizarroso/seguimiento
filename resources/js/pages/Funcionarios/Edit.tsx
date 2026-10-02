import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { FuncionarioForm } from '@/components/features/funcionarios/FuncionarioForm';
import type { Funcionario, Area, Puesto } from '@/types/generated/Tramite';

interface EditProps {
    funcionario: Funcionario;
    areas: { data: Area[] };
    puestos: { data: Puesto[] };
}

export default function FuncionariosEdit({ funcionario, areas, puestos }: EditProps) {
    const form = useForm({
        nombre: funcionario.nombre,
        apellidos: funcionario.apellidos ?? '',
        email: funcionario.email ?? '',
        direccion: funcionario.direccion ?? '',
        nro_telefono: funcionario.nro_telefono ?? '',
        cedula_identidad: funcionario.cedula_identidad ?? '',
        tipo_funcionario: funcionario.tipo_funcionario,
        area_id: String(funcionario.area?.id ?? ''),
        puesto_id: String((funcionario as { puesto?: { id: number } | null }).puesto?.id ?? ''),
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Editar Funcionario</h2>
            <Card>
                <FuncionarioForm form={form} areas={areas} puestos={puestos} isEditing submitUrl={`/funcionarios/${funcionario.id}`} />
            </Card>
        </div>
    );
}
