import { Head, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { TramiteForm, type TramiteAreaOption } from '@/components/features/tramites/TramiteForm';

interface CreateProps {
    areas: { data: (TramiteAreaOption & { predeterminada?: boolean })[] };
}

export default function TramitesCreate({ areas }: CreateProps) {
    const areaPredeterminada = areas.data.find((area) => area.predeterminada) ?? areas.data[0];

    const form = useForm({
        descripcion: '',
        numero_diamante: '',
        area_id: areaPredeterminada ? String(areaPredeterminada.id) : '',
        urgente: false as boolean,
    });

    return (
        <div className="space-y-6">
            <Head title="Nuevo Trámite" />

            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Nuevo Trámite</h2>

            <Card>
                <TramiteForm form={form} areas={areas.data} submitUrl="/tramites" />
            </Card>
        </div>
    );
}