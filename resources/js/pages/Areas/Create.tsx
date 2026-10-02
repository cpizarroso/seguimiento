import { useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { AreaForm } from '@/components/features/areas/AreaForm';
import type { AreaTreeNode } from '@/types/generated/Tramite';

interface CreateProps {
    areas?: { data: AreaTreeNode[] };
}

export default function AreasCreate({ areas }: CreateProps) {
    const form = useForm({
        nombre: '',
        descripcion: '',
        sigla: '',
        codigo: '',
        estado: true,
        parent_id: null as number | null,
        puestos: [] as { _key: number; nombre: string; descripcion: string; sigla: string; codigo: string; estado: boolean }[],
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-patuju-green">Nueva Área</h2>

            <Card>
                <AreaForm form={form} areas={areas?.data ?? []} submitUrl="/areas" />
            </Card>
        </div>
    );
}