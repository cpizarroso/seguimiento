import { Head, useForm } from '@inertiajs/react';
import { Card } from '@/components/ui/Card';
import { TramiteForm, type TramiteAreaOption } from '@/components/features/tramites/TramiteForm';
import type { Tramite } from '@/types/generated/Tramite';

interface EditProps {
    tramite: Tramite;
    areas: { data: TramiteAreaOption[] };
}

export default function TramitesEdit({ tramite, areas }: EditProps) {
    const form = useForm({
        descripcion: tramite.descripcion ?? '',
        numero_diamante: tramite.numero_diamante ?? '',
        area_id: String(tramite.area_id ?? ''),
        urgente: Boolean(tramite.urgente),
    });

    return (
        <div className="space-y-6">
            <Head title={`Editar Trámite ${tramite.numero_completo}`} />

            <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-patuju-green dark:text-patuju-green">
                    Editar Trámite {tramite.numero_completo}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Solo usuarios con el permiso <span className="font-mono">tramites.edicion</span> pueden guardar cambios.
                </span>
            </div>

            <Card>
                <TramiteForm
                    form={form}
                    areas={areas.data}
                    submitUrl={`/tramites/${tramite.id}`}
                    method="put"
                    submitLabel="Actualizar"
                    onCancel={() => window.history.back()}
                />
            </Card>
        </div>
    );
}