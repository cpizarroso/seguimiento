import type { InertiaForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { DestinoDerivacion } from './DestinoDerivacion';
import type { DestinatarioDerivacion } from '@/types/derivaciones';

export type DerivarFormData = {
    area_id: string;
    derivado_a: string;
    glosa_derivacion: string;
    tramite_ids: number[];
};

export type DerivarFormType = InertiaForm<DerivarFormData>;

interface DerivarFormProps {
    form: DerivarFormType;
    destinatarios: DestinatarioDerivacion[];
    submitUrl: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function DerivarForm({ form, destinatarios, submitUrl, onSuccess, onCancel }: DerivarFormProps) {
    const { data, setData, post, processing, errors } = form;
    const puedeEnviar = destinatarios.length > 0 && data.area_id !== '' && data.derivado_a !== '';

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();

                if (!puedeEnviar) return;

                post(submitUrl, {
                    preserveScroll: true,
                    onSuccess: () => onSuccess?.(),
                });
            }}
            className="space-y-4"
        >
            {destinatarios.length === 0 && (
                <div className="rounded-md border border-excel-gold/50 bg-excel-gold/10 px-3 py-2 text-sm text-excel-text dark:text-gray-200">
                    No hay personas con usuario y puesto vigente para recibir la derivación.
                </div>
            )}

            {errors.tramite_ids && (
                <p className="rounded-md border border-excel-red/40 bg-excel-red/10 px-3 py-2 text-sm text-excel-red">
                    {errors.tramite_ids}
                </p>
            )}

            <DestinoDerivacion form={form} destinatarios={destinatarios} />

            <div>
                <label htmlFor="glosa_derivacion" className="block text-xs font-semibold text-excel-text dark:text-gray-200">
                    Glosa de derivación
                </label>
                <textarea
                    id="glosa_derivacion"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-excel-border-strong bg-excel-surface px-3 py-2 text-sm text-excel-text shadow-sm focus:border-excel-green focus:outline-none focus:ring-2 focus:ring-excel-green/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    value={data.glosa_derivacion}
                    onChange={(event) => setData('glosa_derivacion', event.target.value)}
                />
                {errors.glosa_derivacion && <p className="mt-1 text-xs text-excel-red">{errors.glosa_derivacion}</p>}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" loading={processing} disabled={!puedeEnviar}>
                    Derivar
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
            </div>
        </form>
    );
}
