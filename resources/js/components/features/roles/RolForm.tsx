import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PermisoOption, PermisosAgrupados, RolFormData } from '@/types/roles';

/**
 * Contrato mínimo que necesita el formulario. Un `useForm` de Inertia lo
 * cumple; en tests permite inyectar un controlador propio sin mocks globales.
 */
export interface RolFormController {
    data: RolFormData;
    setData(key: keyof RolFormData, value: RolFormData[keyof RolFormData]): void;
    post(url: string, options?: { onSuccess?: () => void }): void;
    put(url: string, options?: { onSuccess?: () => void }): void;
    processing: boolean;
    errors: Partial<Record<keyof RolFormData, string>>;
}

interface RolFormProps {
    form: RolFormController;
    permisosAgrupados?: PermisosAgrupados;
    submitUrl: string;
    method?: 'post' | 'put';
    submitLabel?: string;
    /** Los roles del sistema conservan su slug: el campo se bloquea. */
    slugDisabled?: boolean;
    /** Al escribir el nombre se propone un slug nuevo (solo en el alta). */
    autoSlug?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

function generarSlug(nombre: string): string {
    return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');
}

export function RolForm({
    form,
    permisosAgrupados = {},
    submitUrl,
    method = 'post',
    submitLabel = 'Guardar',
    slugDisabled = false,
    autoSlug = true,
    onSuccess,
    onCancel,
}: RolFormProps) {
    const { data, setData, post, put, processing, errors } = form;

    const togglePermiso = (id: number) => {
        setData('permiso_ids',
            data.permiso_ids.includes(id)
                ? data.permiso_ids.filter((pid) => pid !== id)
                : [...data.permiso_ids, id],
        );
    };

    const cambiarNombre = (nombre: string) => {
        setData('nombre', nombre);

        if (autoSlug) {
            setData('slug', generarSlug(nombre));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const opciones = onSuccess ? { onSuccess } : undefined;

        if (method === 'put') {
            put(submitUrl, opciones);
        } else {
            post(submitUrl, opciones);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Nombre del Rol"
                    value={data.nombre}
                    onChange={(e) => cambiarNombre(e.target.value)}
                    error={errors.nombre}
                />
                <Input
                    label="Slug (identificador único)"
                    value={data.slug}
                    onChange={(e) => setData('slug', e.target.value)}
                    error={errors.slug}
                    disabled={slugDisabled}
                />
            </div>
            <Input
                label="Descripción"
                value={data.descripcion}
                onChange={(e) => setData('descripcion', e.target.value)}
                error={errors.descripcion}
            />

            <div>
                <h3 className="mb-4 text-lg font-semibold text-excel-green">Permisos</h3>
                <div className="space-y-4">
                    {Object.entries(permisosAgrupados).map(([moduloNombre, permisos]) => (
                        <div key={moduloNombre} className="rounded-lg border border-excel-border p-4 dark:border-gray-700">
                            <h4 className="mb-2 font-medium text-excel-text dark:text-gray-200">{moduloNombre}</h4>
                            <div className="flex flex-wrap gap-2">
                                {permisos.map((p: PermisoOption) => {
                                    const activo = data.permiso_ids.includes(p.id);

                                    return (
                                        <label
                                            key={p.id}
                                            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                                activo
                                                    ? 'border-excel-green bg-excel-green-light text-excel-green-dark dark:bg-excel-green/20 dark:text-excel-green'
                                                    : 'border-excel-border bg-excel-surface text-excel-muted hover:border-excel-green dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                aria-label={`${moduloNombre}: ${p.accion_nombre}`}
                                                checked={activo}
                                                onChange={() => togglePermiso(p.id)}
                                            />
                                            {p.accion_nombre}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {errors.permiso_ids && (
                    <p className="mt-1 text-sm text-excel-red">{errors.permiso_ids}</p>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" loading={processing}>{submitLabel}</Button>
                <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : window.history.back())}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
