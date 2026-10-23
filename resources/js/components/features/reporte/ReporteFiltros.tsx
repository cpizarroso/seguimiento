import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Area } from '@/types/generated/Tramite';
import { RangoCalendario } from './RangoCalendario';

interface ReporteFiltrosProps {
    usuarioNombre: string;
    usuarioArea: string | null;
    areaSeleccionadaId: number | null;
    areas: Area[];
    puedeSeleccionarArea: boolean;
    gestion: number | null;
    gestiones: number[];
    numeroTramite: string;
    errorNumeroTramite?: string;
    fechaDesde: string;
    fechaHasta: string;
    soloHoy: boolean;
    puedeGenerar: boolean;
    onAreaChange: (areaId: number | null) => void;
    onGestionChange: (gestion: number | null) => void;
    onNumeroTramiteChange: (valor: string) => void;
    onRangoChange: (desde: string, hasta: string) => void;
    onHoyChange: (valor: boolean) => void;
    onGenerar: () => void;
    onLimpiar: () => void;
}

export function ReporteFiltros({
    usuarioNombre,
    usuarioArea,
    areaSeleccionadaId,
    areas,
    puedeSeleccionarArea,
    gestion,
    gestiones,
    numeroTramite,
    errorNumeroTramite,
    fechaDesde,
    fechaHasta,
    soloHoy,
    puedeGenerar,
    onAreaChange,
    onGestionChange,
    onNumeroTramiteChange,
    onRangoChange,
    onHoyChange,
    onGenerar,
    onLimpiar,
}: ReporteFiltrosProps) {
    return (
        <Card padding="sm" className="print:hidden">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                <div className="min-w-36">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Usuario</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{usuarioNombre}</p>
                </div>

                {puedeSeleccionarArea ? (
                    <div className="min-w-52">
                        <Select
                            id="reporte-area"
                            label="Área del reporte"
                            value={areaSeleccionadaId != null ? String(areaSeleccionadaId) : ''}
                            onChange={(e) => onAreaChange(e.target.value ? Number(e.target.value) : null)}
                            options={areas.map((area) => ({
                                value: String(area.id),
                                label: `${area.codigo} · ${area.nombre}`,
                            }))}
                            placeholder="Seleccionar área"
                        />
                    </div>
                ) : (
                    <div className="min-w-36">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Área</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {usuarioArea ?? 'Sin área asignada'}
                        </p>
                    </div>
                )}

                <div className="min-w-36">
                    <Select
                        id="reporte-gestion"
                        label="Gestión"
                        value={gestion != null ? String(gestion) : ''}
                        onChange={(e) => onGestionChange(e.target.value ? Number(e.target.value) : null)}
                        options={gestiones.map((year) => ({
                            value: String(year),
                            label: String(year),
                        }))}
                        placeholder="Todas las gestiones"
                    />
                </div>

                <div className="min-w-56 flex-1">
                    <Input
                        id="reporte-numero-tramite"
                        label="N° de trámite"
                        labelAdornment={
                            <InfoTooltip
                                label="Ayuda sobre N° de trámite"
                                text={
                                    'Escribe uno o varios números. Puedes usar un rango con guion o una lista separada por comas.\n' +
                                    'Ejemplos: 5 · 1,3,5 · 1-10 · 1-5,8,10-12. El rango incluye ambos extremos.'
                                }
                            />
                        }
                        value={numeroTramite}
                        onChange={(e) => onNumeroTramiteChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && puedeGenerar && onGenerar()}
                        placeholder="Ej.: 5, 1,3,5 o 1-10"
                        error={errorNumeroTramite}
                        autoComplete="off"
                    />
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
