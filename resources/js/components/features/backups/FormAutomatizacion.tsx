import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { backupService } from '@/services/backupService';
import type { Automatizacion } from '@/types/backups';

interface Props {
    automatizacion: Automatizacion;
}

type Modo = 'desactivada' | 'diaria' | 'semanal' | 'mensual';

const DIAS = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' },
];

const MODOS: Array<{ valor: Modo; titulo: string; descripcion: string }> = [
    { valor: 'desactivada', titulo: 'Desactivada', descripcion: 'Solo se generan backups manuales.' },
    { valor: 'diaria', titulo: 'Diaria', descripcion: 'Una copia cada día a la hora indicada.' },
    { valor: 'semanal', titulo: 'Semanal', descripcion: 'Una copia el día de la semana elegido.' },
    { valor: 'mensual', titulo: 'Mensual', descripcion: 'Una copia el día del mes elegido.' },
];

export function FormAutomatizacion({ automatizacion }: Props) {
    const form = useForm({
        habilitado: automatizacion.habilitado,
        frecuencia: automatizacion.frecuencia,
        hora: automatizacion.hora,
        dia_semana: String(automatizacion.dia_semana),
        dia_mes: String(automatizacion.dia_mes),
        maximo: String(automatizacion.maximo),
        cuota_mb: String(automatizacion.cuota_mb),
        alerta_porcentaje: String(automatizacion.alerta_porcentaje),
    });

    const modo: Modo = form.data.habilitado ? form.data.frecuencia : 'desactivada';

    const elegirModo = (valor: Modo) => {
        if (valor === 'desactivada') {
            form.setData('habilitado', false);

            return;
        }

        form.setData({
            ...form.data,
            habilitado: true,
            frecuencia: valor,
        });
    };

    const guardar = () => {
        form.transform((datos) => ({
            ...datos,
            dia_semana: Number(datos.dia_semana),
            dia_mes: Number(datos.dia_mes),
            maximo: Number(datos.maximo),
            cuota_mb: Number(datos.cuota_mb),
            alerta_porcentaje: Number(datos.alerta_porcentaje),
        }));

        form.put(backupService.urls.automatizacion, { preserveScroll: true });
    };

    return (
        <Card padding="lg">
            <form
                className="space-y-5"
                onSubmit={(evento) => {
                    evento.preventDefault();
                    guardar();
                }}
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-excel-text dark:text-gray-100">
                            Automatización de backups
                        </h3>
                        <p className="mt-0.5 text-xs text-excel-muted">
                            Una sola frecuencia puede estar activa. El backup se ejecuta con el scheduler
                            (<span className="font-mono">backups:auto</span>).
                        </p>
                    </div>

                    <div className="rounded-md bg-excel-surface-2 px-3 py-2 text-right text-[11px] leading-relaxed text-excel-muted dark:bg-gray-700/60">
                        <p>
                            Próximo backup:{' '}
                            <span className="font-semibold text-excel-text dark:text-gray-200">
                                {automatizacion.proxima_ejecucion ?? 'No programado'}
                            </span>
                        </p>
                        <p>
                            Última ejecución:{' '}
                            <span className="font-semibold text-excel-text dark:text-gray-200">
                                {automatizacion.ultima_ejecucion ?? 'Nunca'}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {MODOS.map((opcion) => (
                        <label
                            key={opcion.valor}
                            className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition-colors ${
                                modo === opcion.valor
                                    ? 'border-excel-green bg-excel-green-light/60 dark:border-excel-green/60 dark:bg-excel-green/10'
                                    : 'border-excel-border bg-excel-surface hover:bg-excel-surface-2 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            <input
                                type="radio"
                                name="modo-backup"
                                value={opcion.valor}
                                checked={modo === opcion.valor}
                                onChange={() => elegirModo(opcion.valor)}
                                className="mt-0.5 h-4 w-4 accent-excel-green"
                            />
                            <span className="space-y-0.5">
                                <span className="block text-xs font-semibold text-excel-text dark:text-gray-100">
                                    {opcion.titulo}
                                </span>
                                <span className="block text-[11px] leading-snug text-excel-muted">
                                    {opcion.descripcion}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {modo === 'semanal' && (
                        <Select
                            label="Día de la semana"
                            options={DIAS}
                            value={form.data.dia_semana}
                            onChange={(evento) => form.setData('dia_semana', evento.target.value)}
                            error={form.errors.dia_semana}
                        />
                    )}

                    {modo === 'mensual' && (
                        <Input
                            label="Día del mes"
                            type="number"
                            min={1}
                            max={31}
                            value={form.data.dia_mes}
                            onChange={(evento) => form.setData('dia_mes', evento.target.value)}
                            error={form.errors.dia_mes}
                            append="1–31"
                        />
                    )}

                    <Input
                        label="Hora de ejecución"
                        type="time"
                        value={form.data.hora}
                        onChange={(evento) => form.setData('hora', evento.target.value)}
                        error={form.errors.hora}
                    />

                    <Input
                        label="Máximo de backups"
                        type="number"
                        min={1}
                        max={999}
                        value={form.data.maximo}
                        onChange={(evento) => form.setData('maximo', evento.target.value)}
                        error={form.errors.maximo}
                    />

                    <Input
                        label="Cuota (MB)"
                        type="number"
                        min={0}
                        value={form.data.cuota_mb}
                        onChange={(evento) => form.setData('cuota_mb', evento.target.value)}
                        error={form.errors.cuota_mb}
                        append="0 = ilimitado"
                    />

                    <Input
                        label="Alerta de espacio (%)"
                        type="number"
                        min={1}
                        max={99}
                        value={form.data.alerta_porcentaje}
                        onChange={(evento) => form.setData('alerta_porcentaje', evento.target.value)}
                        error={form.errors.alerta_porcentaje}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-excel-border pt-4 dark:border-gray-700">
                    <p className="inline-flex items-center gap-1.5 text-[11px] text-excel-muted">
                        <Icon name="info" size={13} />
                        La retención se aplica al guardar: si baja el máximo, se eliminan los backups más antiguos no
                        protegidos.
                    </p>

                    <Button type="submit" loading={form.processing}>
                        <Icon name="save" size={14} />
                        Guardar cambios
                    </Button>
                </div>
            </form>
        </Card>
    );
}
