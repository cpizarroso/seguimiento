import type { InertiaForm } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckboxList } from '@/components/ui/CheckboxList';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import type { Area, Persona } from '@/types/generated/Tramite';

export interface RolPermiso {
    id: number;
    modulo: string;
    accion: string;
}

export interface RolOption {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string | null;
    es_sistema: boolean;
    permiso_ids: number[];
    permisos: RolPermiso[];
}

export type UserFormType = InertiaForm<{
    name: string;
    email: string;
    phone: string;
    profesion: string;
    password: string;
    persona_id: string;
    role_ids: number[];
    area_ids: number[];
    area_predeterminada_id: string;
}>;

interface UserFormProps {
    form: UserFormType;
    roles?: { data: RolOption[] };
    personas?: { data: Persona[] } | Persona[];
    areas?: { data: Area[] } | Area[];
    submitUrl: string;
    method?: 'post' | 'put';
    isEditing?: boolean;
    personaActualId?: number | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const accionLabels: Record<string, string> = {
    consulta: 'Consulta', creacion: 'Creación', edicion: 'Edición', baja: 'Baja',
};

export function UserForm({ form, roles, personas, areas, submitUrl, method = 'post', isEditing = false, personaActualId = null, onSuccess, onCancel }: UserFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, put, processing, errors } = form;

    const listaPersonas = useMemo(() => {
        if (!personas) return [] as Persona[];
        return Array.isArray(personas) ? personas : personas.data;
    }, [personas]);

    const listaAreas = useMemo(() => {
        if (!areas) return [] as Area[];
        return Array.isArray(areas) ? areas : areas.data;
    }, [areas]);

    const opcionesAreas = useMemo(
        () => listaAreas.map((area) => ({
            value: String(area.id),
            label: `${area.codigo} · ${area.nombre}`,
            description: area.activo ? undefined : 'Inactiva',
        })),
        [listaAreas],
    );

    const areasSeleccionadas = useMemo(
        () => opcionesAreas.filter((area) => data.area_ids.includes(Number(area.value))),
        [opcionesAreas, data.area_ids],
    );

    const opcionesPersona = useMemo(
        () => listaPersonas.map((persona) => ({
            value: String(persona.id),
            label: `${persona.apellidos}, ${persona.nombres}`,
            description: [persona.ci, persona.correo, persona.area?.nombre].filter(Boolean).join(' · '),
            disabled: persona.user !== null && persona.id !== personaActualId,
        })),
        [listaPersonas, personaActualId],
    );

    const toggleRole = (id: number) => {
        setData('role_ids',
            data.role_ids.includes(id)
                ? data.role_ids.filter((rid) => rid !== id)
                : [...data.role_ids, id],
        );
    };

    const seleccionarAreas = (selected: string[]) => {
        const siguientes = selected.map(Number);
        let predeterminada = data.area_predeterminada_id;

        if (predeterminada && !siguientes.includes(Number(predeterminada))) {
            predeterminada = siguientes.length ? String(siguientes[0]) : '';
        }

        if (!predeterminada && siguientes.length) {
            predeterminada = String(siguientes[0]);
        }

        setData({
            ...data,
            area_ids: siguientes,
            area_predeterminada_id: predeterminada,
        });
    };

    const cambiarPredeterminada = (value: string) => {
        setData({ ...data, area_predeterminada_id: value });
    };

    const generarPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < 8; i++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setData('password', pwd);
    };

    const seleccionarPersona = (value: string | null) => {
        setData('persona_id', value ?? '');

        const persona = listaPersonas.find((item) => String(item.id) === value);

        if (persona) {
            setData('name', persona.nombre_completo);
            if (persona.correo) setData('email', persona.correo);
        }
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        const opciones = onSuccess ? { onSuccess } : undefined;

        if (method === 'put') {
            put(submitUrl, opciones);
        } else {
            post(submitUrl, opciones);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <SearchableSelect
                label="Persona vinculada"
                options={opcionesPersona}
                value={data.persona_id || null}
                onChange={seleccionarPersona}
                placeholder="Seleccionar persona"
                searchPlaceholder="Buscar por nombre, CI o correo..."
                error={errors.persona_id}
                required
            />
            {errors.persona_id && <p className="text-xs text-patuju-red">{errors.persona_id}</p>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                    label="Nombre completo"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    error={errors.name}
                    required
                />
                <Input
                    label="Correo electrónico"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    error={errors.email}
                    required
                />
                <Input
                    label="Teléfono"
                    type="tel"
                    value={data.phone}
                    onChange={(event) => setData('phone', event.target.value)}
                    error={errors.phone}
                />
                <Input
                    label="Profesión"
                    value={data.profesion}
                    onChange={(event) => setData('profesion', event.target.value)}
                    error={errors.profesion}
                />
                <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-patuju-green">
                        Contraseña {isEditing && <span className="text-xs text-gray-400">(dejar vacío para conservar)</span>}
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                error={errors.password}
                                required={!isEditing}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? 'Ocultar' : 'Ver'}
                                    </button>
                                }
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={generarPassword} className="shrink-0">
                            Generar
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <CheckboxList
                    label="Áreas habilitadas para crear trámites"
                    items={opcionesAreas}
                    selected={data.area_ids.map(String)}
                    onChange={seleccionarAreas}
                    searchPlaceholder="Filtrar áreas por nombre o código..."
                    emptyMessage="No se encontraron áreas."
                    error={errors.area_ids}
                />
                {data.area_ids.length > 0 && (
                    <div className="mt-3 max-w-sm">
                        <Select
                            label="Área predeterminada"
                            required
                            options={areasSeleccionadas}
                            value={data.area_predeterminada_id}
                            onChange={(event) => cambiarPredeterminada(event.target.value)}
                            error={errors.area_predeterminada_id}
                        />
                        <p className="mt-1 text-xs text-excel-muted dark:text-gray-400">
                            Se preseleccionará al crear un trámite.
                        </p>
                    </div>
                )}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-patuju-green">Roles</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(roles?.data ?? []).map((rol) => (
                        <label
                            key={rol.id}
                            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                                data.role_ids.includes(rol.id)
                                    ? 'border-patuju-green bg-patuju-green/5'
                                    : 'border-gray-200 hover:border-patuju-green dark:border-gray-700'
                            }`}
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="accent-patuju-green"
                                    checked={data.role_ids.includes(rol.id)}
                                    onChange={() => toggleRole(rol.id)}
                                />
                                <span className="text-sm font-medium">{rol.nombre}</span>
                            </div>
                            <div className="ml-6 flex flex-wrap gap-1">
                                {rol.permisos.map((permiso) => (
                                    <span key={permiso.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                                        {permiso.modulo}.{accionLabels[permiso.accion] ?? permiso.accion}
                                    </span>
                                ))}
                            </div>
                        </label>
                    ))}
                </div>
                {errors.role_ids && <p className="mt-1 text-sm text-patuju-red">{errors.role_ids}</p>}
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" loading={processing}>Guardar</Button>
                <Button type="button" variant="secondary" onClick={() => (onCancel ? onCancel() : window.history.back())}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
