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
            <div
    aria-label="Trámites seleccionados"
    className="mt-2 flex flex-wrap items-center gap-1.5 max-h-48 overflow-y-auto"
>
    {tramites.map((tramite) => (
        <span
            key={tramite.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-excel-green/10 text-excel-green dark:bg-excel-green/20 dark:text-excel-green border border-excel-green/20"
        >
            {tramite.numero_completo}
        </span>
    ))}
</div>
        </div>
    );
}
