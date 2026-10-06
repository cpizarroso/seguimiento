import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RangoCalendario } from './RangoCalendario';

interface ReporteFiltrosProps {
    usuarioNombre: string;
    usuarioArea: string | null;
    fechaDesde: string;
    fechaHasta: string;
    soloHoy: boolean;
    puedeGenerar: boolean;
    onRangoChange: (desde: string, hasta: string) => void;
    onHoyChange: (valor: boolean) => void;
    onGenerar: () => void;
    onLimpiar: () => void;
}

export function ReporteFiltros({
    usuarioNombre,
    usuarioArea,
    fechaDesde,
    fechaHasta,
    soloHoy,
    puedeGenerar,
    onRangoChange,
    onHoyChange,
    onGenerar,
    onLimpiar,
}: ReporteFiltrosProps) {
    return (
        <Card padding="sm" className="print:hidden">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <div className="min-w-36">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Usuario</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{usuarioNombre}</p>
                </div>
                <div className="min-w-36">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Área</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {usuarioArea ?? 'Sin área asignada'}
                    </p>
                </div>
                <div className="min-w-52 flex-1">
                    <RangoCalendario
                        desde={fechaDesde}
                        hasta={fechaHasta}
                        deshabilitado={false}
                        onChange={onRangoChange}
                    />
                </div>

                <label className="flex cursor-pointer items-center gap-2 pb-1 select-none">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={soloHoy}
                        aria-label="Solo hoy"
                        onClick={() => onHoyChange(!soloHoy)}
                        className={`relative h-5 w-9 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-patuju-green/50 ${
                            soloHoy ? 'bg-patuju-green' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                                soloHoy ? 'left-[1.125rem]' : 'left-0.5'
                            }`}
                        />
                    </button>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Hoy
                    </span>
                </label>

                <Button onClick={onGenerar} disabled={!puedeGenerar} size="sm" className="mb-0.5">
                    Generar
                </Button>
                <Button onClick={onLimpiar} variant="secondary" size="sm" className="mb-0.5">
                    Limpiar
                </Button>
            </div>
        </Card>
    );
}
