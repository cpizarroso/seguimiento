import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import type { PermisoCatalogo, PermisoOverride } from './UserForm';

const ACCIONES: Record<string, string> = {
    consulta: 'Consulta',
    creacion: 'Creación',
    edicion: 'Edición',
    baja: 'Baja',
    tramitacion: 'Tramitación',
};

type Estado = 'heredar' | 'permitir' | 'denegar';

interface PermisosUsuarioProps {
    catalogo: PermisoCatalogo[];
    seleccionados: PermisoOverride[];
    permisosDelRol: Set<number>;
    onChange: (permisoId: number, estado: Estado) => void;
    error?: string;
}

export function PermisosUsuario({ catalogo, seleccionados, permisosDelRol, onChange, error }: PermisosUsuarioProps) {
    const [busqueda, setBusqueda] = useState('');

    const overrides = useMemo(
        () => new Map(seleccionados.map((permiso) => [permiso.permiso_id, permiso.permitido])),
        [seleccionados],
    );

    const grupos = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        const visibles = catalogo.filter((permiso) => {
            if (termino === '') return true;
            const texto = `${permiso.modulo_nombre} ${permiso.modulo} ${permiso.accion_nombre} ${permiso.accion}`.toLowerCase();
            return texto.includes(termino);
        });

        const mapa = new Map<string, { modulo: string; nombre: string; permisos: PermisoCatalogo[] }>();

        visibles.forEach((permiso) => {
            const grupo = mapa.get(permiso.modulo) ?? {
                modulo: permiso.modulo,
                nombre: permiso.modulo_nombre,
                permisos: [],
            };

            grupo.permisos.push(permiso);
            mapa.set(permiso.modulo, grupo);
        });

        return Array.from(mapa.values());
    }, [catalogo, busqueda]);

    return (
        <div className="rounded-lg border border-excel-border p-3 dark:border-gray-700">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-medium text-patuju-green">Permisos del usuario</p>
                    <p className="text-xs text-excel-muted dark:text-gray-400">
                        Hereda lo que aportan sus roles. Un override explícito gana siempre.
                    </p>
                </div>
                <Input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar permiso..."
                    autoComplete="off"
                    className="w-56"
                />
            </div>

            {grupos.length === 0 && (
                <p className="text-xs text-excel-muted dark:text-gray-400">No se encontraron permisos.</p>
            )}

            <div className="space-y-3">
                {grupos.map((grupo) => (
                    <div key={grupo.modulo}>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-excel-muted dark:text-gray-400">
                            {grupo.nombre}
                        </p>
                        <ul className="divide-y divide-excel-border rounded-md border border-excel-border dark:divide-gray-700 dark:border-gray-700">
                            {grupo.permisos.map((permiso) => {
                                const valor = overrides.get(permiso.id);
                                const actual: Estado = valor === undefined ? 'heredar' : valor ? 'permitir' : 'denegar';
                                const rolLoPermite = permisosDelRol.has(permiso.id);

                                return (
                                    <li key={permiso.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm text-excel-text dark:text-gray-100">
                                                {ACCIONES[permiso.accion] ?? permiso.accion_nombre}
                                            </p>
                                            <p className="text-[11px] text-excel-muted dark:text-gray-400">
                                                {rolLoPermite ? 'El rol lo permite' : 'El rol no lo permite'}
                                            </p>
                                        </div>
                                        <div
                                            className="inline-flex overflow-hidden rounded-md border border-excel-border-strong dark:border-gray-600"
                                            role="group"
                                            aria-label={`Permiso ${permiso.modulo}.${permiso.accion}`}
                                        >
                                            {(['heredar', 'permitir', 'denegar'] as const).map((opcion) => (
                                                <button
                                                    key={opcion}
                                                    type="button"
                                                    onClick={() => onChange(permiso.id, opcion)}
                                                    aria-pressed={actual === opcion}
                                                    className={`px-2 py-1 text-xs font-medium transition-colors ${
                                                        actual === opcion
                                                            ? 'bg-excel-green text-white'
                                                            : 'text-excel-muted hover:bg-excel-surface-2 dark:text-gray-300 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {opcion === 'heredar' ? 'Heredar' : opcion === 'permitir' ? 'Permitir' : 'Denegar'}
                                                </button>
                                            ))}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            {error && <p className="mt-2 text-xs text-excel-red">{error}</p>}
        </div>
    );
}
