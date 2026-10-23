import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { AreaOpcion, AreaTreeNode } from '@/types/generated/Tramite';

interface Responsable {
    id: number;
    name: string;
    email: string;
}

interface AreaFormModalProps {
    open: boolean;
    onClose: () => void;
    area?: AreaTreeNode | null;
    areasOpciones: AreaOpcion[];
    responsables: Responsable[];
    defaultParentId?: number | null;
}

const PUESTOS_ESTANDAR = [
    { value: 'JEFE', label: 'JEFE' },
    { value: 'PROFESIONAL', label: 'PROFESIONAL' },
    { value: 'SECRETARIA', label: 'SECRETARIA' },
    { value: 'ASISTENTE', label: 'ASISTENTE' },
];

function descendientesIds(area: AreaTreeNode): number[] {
    return area.children.flatMap((hijo) => [hijo.id, ...descendientesIds(hijo)]);
}

export function AreaFormModal({
    open,
    onClose,
    area,
    areasOpciones,
    responsables,
    defaultParentId = null,
}: AreaFormModalProps) {
    const form = useForm({
        nombre: '',
        codigo: '',
        descripcion: '',
        activo: true,
        area_padre_id: '' as string,
        user_id: '' as string,
        puestos_estandar: [] as string[],
    });

    useEffect(() => {
        if (!open) return;

        if (area) {
            form.setData({
                nombre: area.nombre,
                codigo: area.codigo,
                descripcion: area.descripcion ?? '',
                activo: area.activo,
                area_padre_id: area.area_padre_id ? String(area.area_padre_id) : '',
                user_id: area.user_id ? String(area.user_id) : '',
                puestos_estandar: [],
            });
        } else {
            form.setData({
                nombre: '',
                codigo: '',
                descripcion: '',
                activo: true,
                area_padre_id: defaultParentId ? String(defaultParentId) : '',
                user_id: '',
                puestos_estandar: ['JEFE', 'PROFESIONAL', 'SECRETARIA', 'ASISTENTE'],
            });
        }
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, area?.id, defaultParentId]);

    const opcionesPadre = useMemo(() => {
        if (!area) return areasOpciones;

        const excluidos = new Set([area.id, ...descendientesIds(area)]);

        return areasOpciones.filter((opcion) => !excluidos.has(opcion.id));
    }, [areasOpciones, area]);

    const opcionesResponsable = useMemo(
        () => responsables.map((usuario) => ({
            value: String(usuario.id),
            label: usuario.name,
            description: usuario.email,
        })),
        [responsables],
    );

    const togglePuesto = (puesto: string) => {
        const actuales = form.data.puestos_estandar;
        form.setData(
            'puestos_estandar',
            actuales.includes(puesto)
                ? actuales.filter((p) => p !== puesto)
                : [...actuales, puesto],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            area_padre_id: data.area_padre_id ? Number(data.area_padre_id) : null,
            user_id: data.user_id ? Number(data.user_id) : null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (area) {
            form.put(`/areas/${area.id}`, options);
        } else {
            form.post('/areas', options);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={area ? 'Editar área' : 'Nueva área'}
            maxWidth="2xl"
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Nombre"
                        required
                        value={form.data.nombre}
                        onChange={(event) => form.setData('nombre', event.target.value)}
                        error={form.errors.nombre}
                        placeholder="Área Legal"
                    />
                    <Input
                        label="Código"
                        required
                        value={form.data.codigo}
                        onChange={(event) => form.setData('codigo', event.target.value.toUpperCase())}
                        error={form.errors.codigo}
                        placeholder="LEG"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-patuju-green">Descripción</label>
                    <textarea
                        value={form.data.descripcion}
                        onChange={(event) => form.setData('descripcion', event.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-patuju-green focus:outline-none focus:ring-1 focus:ring-patuju-green dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Descripción del área"
                    />
                    {form.errors.descripcion && <p className="mt-1 text-xs text-patuju-red">{form.errors.descripcion}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <SearchableSelect
                        label="Área padre"
                        options={opcionesPadre.map((opcion) => ({
                            value: String(opcion.id),
                            label: opcion.nombre,
                            path: opcion.path,
                            depth: opcion.depth,
                            activo: opcion.activo,
                            disabled: !opcion.activo,
                        }))}
                        value={form.data.area_padre_id || null}
                        onChange={(value) => form.setData('area_padre_id', value ?? '')}
                        placeholder="Sin área padre (raíz)"
                        searchPlaceholder="Buscar por nombre o código..."
                        clearable
                        clearLabel="Sin área padre (raíz)"
                        error={form.errors.area_padre_id}
                    />

                    <SearchableSelect
                        label="Responsable"
                        options={opcionesResponsable}
                        value={form.data.user_id || null}
                        onChange={(value) => form.setData('user_id', value ?? '')}
                        placeholder="Sin responsable"
                        searchPlaceholder="Buscar por nombre o correo..."
                        clearable
                        clearLabel="Sin responsable"
                        error={form.errors.user_id}
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input
                        type="checkbox"
                        checked={form.data.activo}
                        onChange={(event) => form.setData('activo', event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-patuju-green focus:ring-patuju-green"
                    />
                    Área activa
                </label>

                {!area && (
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <p className="mb-3 text-sm font-medium text-patuju-green">Puestos estándar a crear</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {PUESTOS_ESTANDAR.map((puesto) => (
                                <label key={puesto.value} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                    <input
                                        type="checkbox"
                                        checked={form.data.puestos_estandar.includes(puesto.value)}
                                        onChange={() => togglePuesto(puesto.value)}
                                        className="h-4 w-4 rounded border-gray-300 text-patuju-green focus:ring-patuju-green"
                                    />
                                    {puesto.label}
                                </label>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Se crearán con códigos que combinan el código del área y el sufijo del puesto.
                        </p>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando...' : area ? 'Actualizar área' : 'Crear área'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
