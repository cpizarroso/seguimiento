import { Head, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { TramiteForm, type TramiteAreaOption } from '@/components/features/tramites/TramiteForm';
import { fechaHoraActual } from '@/components/ui/SelectorFechaHora';
import type { SecuenciasPorArea } from '@/types/tramites';

interface CreateProps {
    areas: { data: (TramiteAreaOption & { predeterminada?: boolean })[] };
    secuencias?: SecuenciasPorArea;
}

export default function TramitesCreate({ areas, secuencias }: CreateProps) {
    const areaPredeterminada = areas.data.find((area) => area.predeterminada) ?? areas.data[0];

    const form = useForm({
        descripcion: '',
        numero_diamante: '',
        area_id: areaPredeterminada ? String(areaPredeterminada.id) : '',
        urgente: false as boolean,
        fecha: fechaHoraActual(),
    });

    return (
        <div className="space-y-6">
            <Head title="Nuevo Trámite" />

            <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">Nuevo Trámite</h2>

            <Card>
                <TramiteForm form={form} areas={areas.data} secuencias={secuencias} submitUrl="/tramites" />
            </Card>
        </div>
    );
}