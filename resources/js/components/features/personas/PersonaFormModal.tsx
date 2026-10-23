import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { AreaOpcion, Persona, Puesto } from '@/types/generated/Tramite';

interface PersonaFormModalProps {
    open: boolean;
    onClose: () => void;
    persona?: Persona | null;
    areas: AreaOpcion[];
    puestos: Puesto[];
}

export function PersonaFormModal({ open, onClose, persona, areas, puestos }: PersonaFormModalProps) {
    const form = useForm({
        nombres: '',
        apellidos: '',
        ci: '',
        telefono: '',
        correo: '',
        direccion: '',
        activo: true,
        area_id: '' as string,
        puesto_id: '' as string,
        fecha_inicio: '',
    });

    useEffect(() => {
        if (!open) return;

        const puestoActivo = persona?.puesto_activo?.puesto ?? null;

        form.setData({
            nombres: persona?.nombres ?? '',
            apellidos: persona?.apellidos ?? '',
            ci: persona?.ci ?? '',
            telefono: persona?.telefono ?? '',
            correo: persona?.correo ?? '',
            direccion: persona?.direccion ?? '',
            activo: persona?.activo ?? true,
            area_id: puestoActivo?.area_id ? String(puestoActivo.area_id) : (persona?.area?.id ? String(persona.area.id) : ''),
            puesto_id: persona?.puesto_activo?.puesto_id ? String(persona.puesto_activo.puesto_id) : '',
            fecha_inicio: '',
        });
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, persona?.id]);

    const puestosFiltrados = useMemo(() => {
        const activos = puestos.filter((puesto) => puesto.activo);
        if (!form.data.area_id) return activos;
        return activos.filter((puesto) => String(puesto.area_id) === form.data.area_id);
    }, [puestos, form.data.area_id]);

    const opcionesArea = useMemo(
        () => areas.filter((area) => area.activo).map((area) => ({
            value: String(area.id),
            label: area.nombre,
            path: area.path,
            depth: area.depth,
        })),
        [areas],
    );

    const opcionesPuesto = useMemo(
        () => puestosFiltrados.map((puesto) => ({
            value: String(puesto.id),
            label: puesto.nombre,
            description: `${puesto.codigo} · ${puesto.area?.nombre ?? ''}`,
        })),
        [puestosFiltrados],
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            nombres: data.nombres,
            apellidos: data.apellidos,
            ci: data.ci,
            telefono: data.telefono || null,
            correo: data.correo || null,
            direccion: data.direccion || null,
            activo: data.activo,
            puesto_id: data.puesto_id ? Number(data.puesto_id) : null,
            fecha_inicio: data.fecha_inicio || null,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (persona) {
            form.put(`/personas/${persona.id}`, options);
        } else {
            form.post('/personas', options);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={persona ? 'Editar persona' : 'Nueva persona'}
            maxWidth="2xl"
        >
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Nombres"
                        required
                        value={form.data.nombres}
                        onChange={(event) => form.setData('nombres', event.target.value)}
                        error={form.errors.nombres}
                    />
                    <Input
                        label="Apellidos"
                        required
                        value={form.data.apellidos}
                        onChange={(event) => form.setData('apellidos', event.target.value)}
                        error={form.errors.apellidos}
                    />
                    <Input
                        label="Cédula de identidad"
                        required
                        value={form.data.ci}
                        onChange={(event) => form.setData('ci', event.target.value)}
                        error={form.errors.ci}
                    />
                    <Input
                        label="Teléfono"
                        value={form.data.telefono}
                        onChange={(event) => form.setData('telefono', event.target.value)}
                        error={form.errors.telefono}
                    />
                    <Input
                        label="Correo electrónico"
                        type="email"
                        value={form.data.correo}
                        onChange={(event) => form.setData('correo', event.target.value)}
                        error={form.errors.correo}
                    />
                    <Input
                        label="Dirección"
                        value={form.data.direccion}
                        onChange={(event) => form.setData('direccion', event.target.value)}
                        error={form.errors.direccion}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <SearchableSelect
                        label="Área"
                        options={opcionesArea}
                        value={form.data.area_id || null}
                        onChange={(value) => {
                            form.setData('area_id', value ?? '');
                            form.setData('puesto_id', '');
                        }}
                        placeholder="Seleccionar área"
                        searchPlaceholder="Buscar área..."
                        clearable
                        clearLabel="Sin área"
                        error={form.errors.area_id}
                    />
                    <SearchableSelect
                        label="Puesto vigente"
                        options={opcionesPuesto}
                        value={form.data.puesto_id || null}
                        onChange={(value) => form.setData('puesto_id', value ?? '')}
                        placeholder="Seleccionar puesto"
                        searchPlaceholder="Buscar puesto..."
                        clearable
                        clearLabel="Sin puesto"
                        emptyMessage="No hay puestos activos para el área seleccionada."
                        error={form.errors.puesto_id}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Fecha de inicio del puesto"
                        type="date"
                        value={form.data.fecha_inicio}
                        onChange={(event) => form.setData('fecha_inicio', event.target.value)}
                        error={form.errors.fecha_inicio}
                    />
                    <label className="flex items-end gap-2 pb-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                            type="checkbox"
                            checked={form.data.activo}
                            onChange={(event) => form.setData('activo', event.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-patuju-green focus:ring-patuju-green"
                        />
                        Persona activa
                    </label>
                </div>

                <p className="text-xs text-gray-500">
                    Al cambiar el puesto, el puesto anterior se cierra con la fecha de hoy y queda en el historial.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando...' : persona ? 'Actualizar persona' : 'Crear persona'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
