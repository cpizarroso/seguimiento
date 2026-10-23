import { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import type { DestinatarioDerivacion } from '@/types/derivaciones';

export interface DestinoDerivacionForm {
    data: {
        area_id: string;
        derivado_a: string;
    };
    setData: (key: 'area_id' | 'derivado_a', value: string) => void;
    errors: {
        area_id?: string;
        derivado_a?: string;
    };
}

interface DestinoDerivacionProps {
    form: DestinoDerivacionForm;
    destinatarios: DestinatarioDerivacion[];
}

export function DestinoDerivacion({ form, destinatarios }: DestinoDerivacionProps) {
    const areas = useMemo(() => {
        const mapa = new Map<number, string>();

        destinatarios.forEach((destinatario) => {
            if (!mapa.has(destinatario.area_id)) {
                mapa.set(destinatario.area_id, `${destinatario.area_codigo} · ${destinatario.area_nombre}`);
            }
        });

        return [...mapa.entries()]
            .map(([id, label]) => ({ value: String(id), label }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [destinatarios]);

    const personas = useMemo(
        () => destinatarios
            .filter((destinatario) => String(destinatario.area_id) === form.data.area_id)
            .map((destinatario) => ({
                value: String(destinatario.user_id),
                label: destinatario.persona ?? destinatario.name,
                description: destinatario.persona && destinatario.persona !== destinatario.name
                    ? destinatario.name
                    : undefined,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es')),
        [destinatarios, form.data.area_id],
    );

    const cambiarArea = (areaId: string) => {
        form.setData('area_id', areaId);
        form.setData('derivado_a', '');
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
                label="Área"
                required
                placeholder="Seleccione un área"
                options={areas}
                value={form.data.area_id}
                onChange={(event) => cambiarArea(event.target.value)}
                error={form.errors.area_id}
                disabled={destinatarios.length === 0}
            />

            <SearchableSelect
                label="Persona"
                ariaLabel="Persona"
                required
                placeholder={form.data.area_id ? 'Seleccione una persona' : 'Primero seleccione un área'}
                searchPlaceholder="Buscar persona..."
                emptyMessage={form.data.area_id
                    ? 'No hay personas con usuario en esta área.'
                    : 'Seleccione un área para ver las personas.'}
                options={personas}
                value={form.data.derivado_a || null}
                onChange={(value) => form.setData('derivado_a', value ?? '')}
                disabled={!form.data.area_id || personas.length === 0}
                error={form.errors.derivado_a}
                showPath={false}
            />
        </div>
    );
}
