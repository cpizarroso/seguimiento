import type { UseFormReturn } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Area } from '@/types/generated/Tramite';

type FormType = ReturnType<UseFormReturn<Record<string, unknown>>>;

interface AreaFormProps {
    form: FormType;
    areas?: Area[];
    isEditing?: boolean;
    submitUrl: string;
}

function buildTreeOptions(areas: Area[], level = 0): { value: string; label: string }[] {
    return areas.flatMap((a) => [
        {
            value: String(a.id),
            label: `${'— '.repeat(level)}${a.nombre} (${a.sigla})`,
        },
        ...(a.children?.length ? buildTreeOptions(a.children, level + 1) : []),
    ]);
}

export function AreaForm({ form, areas = [], isEditing, submitUrl }: AreaFormProps) {
    const { data, setData, post, put, processing, errors } = form;
    const method = isEditing ? put : post;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        method(submitUrl);
    };

    const parentOptions = [
        { value: '', label: '— Ninguna (área raíz) —' },
        ...buildTreeOptions(areas),
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Nombre"
                    value={String(data.nombre ?? '')}
                    onChange={(e) => setData('nombre', e.target.value)}
                    error={errors.nombre as string}
                />
                <Input
                    label="Sigla"
                    value={String(data.sigla ?? '')}
                    onChange={(e) => setData('sigla', e.target.value)}
                    error={errors.sigla as string}
                    maxLength={10}
                />
            </div>

            <Select
                label="Área padre"
                placeholder="Seleccione un área padre"
                options={parentOptions}
                value={String(data.parent_id ?? '')}
                onChange={(e) => setData('parent_id', e.target.value || null)}
                error={errors.parent_id as string}
            />

            <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-patuju-green dark:text-patuju-green">
                    Descripción
                </label>
                <textarea
                    id="descripcion"
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:bg-gray-700 dark:text-white"
                    value={String(data.descripcion ?? '')}
                    onChange={(e) => setData('descripcion', e.target.value)}
                />
                {errors.descripcion && (
                    <p className="text-xs text-patuju-red mt-1">{errors.descripcion as string}</p>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" loading={processing}>
                    {isEditing ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => window.history.back()}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
