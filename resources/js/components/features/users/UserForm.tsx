import { usePage } from '@inertiajs/react';
import type { InertiaForm } from '@inertiajs/react';
import { useMemo, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckboxList } from '@/components/ui/CheckboxList';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import type { Area, Persona } from '@/types/generated/Tramite';
import { SugerenciasContrasena } from './SugerenciasContrasena';
import { construirReporteAcceso } from './passwordReset';

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
    username: string;
    email: string;
    password: string;
    persona_id: string;
    role_ids: number[];
    area_ids: number[];
    area_predeterminada_id: string;
}>;

/** Datos del reporte de acceso que se muestra tras crear un usuario. */
export interface UsuarioCreado {
    nombre: string;
    username: string;
    reporte: string;
}

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
    /** Se invoca al crear un usuario, con el reporte copiable listo. */
    onCreated?: (creado: UsuarioCreado) => void;
    onCancel?: () => void;
}

const accionLabels: Record<string, string> = {
    consulta: 'Consulta', creacion: 'Creación', edicion: 'Edición', baja: 'Baja',
};

export function usernameDesdeEmail(email: string): string {
    return email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')
        .replace(/^[._-]+|[._-]+$/g, '');
}

/**
 * Construye el email de acceso a partir del correo de la persona, pero con el
 * dominio de la aplicación (APP_USER_DOMAIN). Devuelve null si no se puede.
 */
export function emailDeAcceso(correo: string | null | undefined, dominio: string): string | null {
    const local = correo ? usernameDesdeEmail(correo) : '';

    if (local === '' || dominio.trim() === '') {
        return null;
    }

    return `${local}@${dominio.trim()}`;
}

export function UserForm({ form, roles, personas, areas, submitUrl, method = 'post', isEditing = false, personaActualId = null, onSuccess, onCreated, onCancel }: UserFormProps) {
    const { data, setData, post, put, processing, errors } = form;
    const dominioUsuario = usePage().props.dominio_usuario ?? '';

    const listaPersonas = useMemo(() => {
        if (!personas) return [] as Persona[];
        return Array.isArray(personas) ? personas : personas.data;
    }, [personas]);

    const listaAreas = useMemo(() => {
        if (!areas) return [] as Area[];
        return Array.isArray(areas) ? areas : areas.data;
    }, [areas]);

    const personaSeleccionada = useMemo(
        () => listaPersonas.find((persona) => String(persona.id) === data.persona_id) ?? null,
        [listaPersonas, data.persona_id],
    );

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

    const cambiarEmail = (email: string) => {
        const derivadoAnterior = usernameDesdeEmail(data.email);
        const derivadoNuevo = usernameDesdeEmail(email);
        const autocompletar = data.username === '' || data.username === derivadoAnterior;

        setData({
            ...data,
            email,
            username: autocompletar ? derivadoNuevo : data.username,
        });
    };

    const seleccionarPersona = (value: string | null) => {
        const persona = listaPersonas.find((item) => String(item.id) === value);

        if (!persona) {
            setData('persona_id', value ?? '');
            return;
        }

        const derivadoAnterior = usernameDesdeEmail(data.email);
        const autocompletar = data.username === '' || data.username === derivadoAnterior;
        const email = emailDeAcceso(persona.correo, dominioUsuario) ?? persona.correo ?? data.email;

        setData({
            ...data,
            persona_id: String(persona.id),
            email,
            username: autocompletar ? usernameDesdeEmail(email) : data.username,
        });
    };

    const reporteDeAcceso = (): UsuarioCreado => {
        const nombre = personaSeleccionada?.nombre_completo ?? data.username;
        const area = personaSeleccionada?.area
            ? [personaSeleccionada.area.codigo, personaSeleccionada.area.nombre].filter(Boolean).join(' · ')
            : null;

        return {
            nombre,
            username: data.username,
            reporte: construirReporteAcceso({
                nombre,
                cargo: personaSeleccionada?.puesto_activo?.puesto?.nombre ?? null,
                area,
                username: data.username,
            }, data.password),
        };
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        const opciones = {
            preserveScroll: true,
            onSuccess: () => {
                if (method === 'post' && onCreated) {
                    onCreated(reporteDeAcceso());
                }

                onSuccess?.();
            },
        };

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

            {personaSeleccionada && (
                <div className="rounded-lg border border-excel-border bg-excel-surface-2 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-excel-text dark:text-gray-100">
                            {personaSeleccionada.nombre_completo}
                        </p>
                        <span className="text-xs text-excel-muted dark:text-gray-400">CI {personaSeleccionada.ci}</span>
                    </div>
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                        <div className="flex justify-between gap-3 sm:block">
                            <dt className="text-excel-muted dark:text-gray-400">Correo de contacto</dt>
                            <dd className="text-excel-text dark:text-gray-200">{personaSeleccionada.correo ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3 sm:block">
                            <dt className="text-excel-muted dark:text-gray-400">Teléfono</dt>
                            <dd className="text-excel-text dark:text-gray-200">{personaSeleccionada.telefono ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3 sm:block">
                            <dt className="text-excel-muted dark:text-gray-400">Área</dt>
                            <dd className="text-excel-text dark:text-gray-200">{personaSeleccionada.area?.nombre ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-3 sm:block">
                            <dt className="text-excel-muted dark:text-gray-400">Puesto vigente</dt>
                            <dd className="text-excel-text dark:text-gray-200">
                                {personaSeleccionada.puesto_activo?.puesto?.nombre ?? '—'}
                            </dd>
                        </div>
                    </dl>
                    <p className="mt-2 text-[11px] text-excel-muted dark:text-gray-500">
                        Los datos personales se editan desde el módulo Personas.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <Input
                        label="Email de acceso"
                        type="email"
                        value={data.email}
                        onChange={(event) => cambiarEmail(event.target.value)}
                        error={errors.email}
                        required
                    />
                    <p className="mt-1 text-xs text-excel-muted dark:text-gray-400">
                        Al elegir la persona se arma con el dominio
                        {dominioUsuario ? ` @${dominioUsuario}` : ' institucional'}.
                    </p>
                </div>
                <Input
                    label="Usuario"
                    value={data.username}
                    onChange={(event) => setData('username', event.target.value.toLowerCase())}
                    error={errors.username}
                    required
                    placeholder="Se completa desde el email"
                />
                <div className="sm:col-span-2">
                    <SugerenciasContrasena
                        value={data.password}
                        onChange={(valor) => setData('password', valor)}
                        nombres={personaSeleccionada?.nombres}
                        apellidos={personaSeleccionada?.apellidos}
                        ci={personaSeleccionada?.ci}
                        error={errors.password}
                        required={!isEditing}
                        mostrarSugerencias={!isEditing}
                        labelAdornment={isEditing
                            ? (
                                <span className="text-[11px] font-normal text-excel-muted dark:text-gray-500">
                                    (dejar vacío para conservar)
                                </span>
                            )
                            : undefined}
                    />
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
