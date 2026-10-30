import type { TramiteResumenDerivacion } from '@/types/derivaciones';

interface ResumenTramitesProps {
    tramites: TramiteResumenDerivacion[];
}

export function ResumenTramites({ tramites }: ResumenTramitesProps) {
    if (tramites.length === 0) return null;

    return (
        <div className="rounded-md border border-excel-border bg-excel-surface-2 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-semibold text-excel-text dark:text-gray-200">
                {tramites.length} trámite{tramites.length === 1 ? '' : 's'} seleccionado{tramites.length === 1 ? '' : 's'}
            </p>
            <ul
                aria-label="Trámites seleccionados"
                className="mt-2 max-h-48 divide-y divide-excel-border overflow-y-auto dark:divide-gray-700"
            >
                {tramites.map((tramite) => (
                    <li key={tramite.id} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-excel-green dark:text-excel-green">
                                {tramite.numero_completo}
                            </span>
                            {tramite.area && (
                                <span className="text-xs text-excel-muted dark:text-gray-400">{tramite.area}</span>
                            )}
                            {tramite.fecha && (
                                <span className="text-xs text-excel-muted dark:text-gray-400">· {tramite.fecha}</span>
                            )}
                        </div>
                        <p className="line-clamp-1 text-xs text-excel-text dark:text-gray-300">
                            {tramite.descripcion}
                        </p>
                        {tramite.derivacion_numero !== null && (
                            <p className="text-[11px] text-excel-muted dark:text-gray-400">
                                Derivación N° {tramite.derivacion_numero}
                                {tramite.derivacion_fecha ? ` · ${tramite.derivacion_fecha}` : ''}
                                {tramite.derivado_de ? ` · de ${tramite.derivado_de}` : ''}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
