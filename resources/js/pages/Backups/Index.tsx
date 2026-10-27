import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { EstadoAlmacenamiento } from '@/components/features/backups/EstadoAlmacenamiento';
import { FormAutomatizacion } from '@/components/features/backups/FormAutomatizacion';
import { ModalEliminar } from '@/components/features/backups/ModalEliminar';
import { ModalHistorial } from '@/components/features/backups/ModalHistorial';
import { ModalRestaurar } from '@/components/features/backups/ModalRestaurar';
import { ModalRestaurarArchivo } from '@/components/features/backups/ModalRestaurarArchivo';
import { TablaBackups } from '@/components/features/backups/TablaBackups';
import { etiquetaAccion } from '@/components/features/backups/formato';
import { useBackups } from '@/hooks/useBackups';
import type { BackupsIndexProps, NivelAlerta } from '@/types/backups';

type Pestana = 'backups' | 'automatizacion';

const estilosAlerta: Record<NivelAlerta, string> = {
    info: 'border-excel-blue/30 bg-[#e5f1fb] text-[#005a9e] dark:border-excel-blue/30 dark:bg-excel-blue/10 dark:text-[#7cc0f5]',
    warning:
        'border-excel-gold/40 bg-[#fff8d6] text-[#8a6700] dark:border-excel-gold/30 dark:bg-excel-gold/10 dark:text-excel-gold',
    danger: 'border-excel-red/30 bg-[#fdecea] text-excel-red dark:border-excel-red/30 dark:bg-excel-red/10 dark:text-[#f28b82]',
};

const iconoAlerta: Record<NivelAlerta, 'info' | 'warning' | 'close'> = {
    info: 'info',
    warning: 'warning',
    danger: 'warning',
};

export default function BackupsIndex({
    backups,
    espacio,
    automatizacion,
    historial,
    puede,
    limite_importacion_mb,
}: BackupsIndexProps) {
    const [pestana, setPestana] = useState<Pestana>('backups');
    const acciones = useBackups(puede);

    const completados = backups.data.filter((backup) => backup.estado === 'completado').length;
    const excedeTope = completados > espacio.backups.maximo;
    const ultimosEventos = historial.slice(0, 8);

    return (
        <div className="space-y-4">
            <Head title="Backups" />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-excel-text dark:text-gray-100">Backups</h1>
                    <p className="mt-0.5 break-all font-mono text-[11px] text-excel-muted">
                        {espacio.disco.ruta}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span title="Volver a leer el estado del disco">
                        <Button type="button" variant="ghost" size="sm" onClick={acciones.actualizarEspacio}>
                            <Icon name="refresh" size={14} />
                            Actualizar
                        </Button>
                    </span>

                    <span title={puede.restaurar ? 'Restaurar desde un archivo .sql o .sql.gz' : 'Sin permiso de restauración'}>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={!puede.restaurar}
                            onClick={acciones.abrirArchivo}
                        >
                            <Icon name="upload" size={14} />
                            Restaurar desde archivo
                        </Button>
                    </span>

                    <span title={puede.crear ? 'Generar un backup manual ahora' : 'Sin permiso de creación'}>
                        <Button
                            type="button"
                            size="sm"
                            disabled={!puede.crear}
                            loading={acciones.creando}
                            onClick={acciones.crear}
                        >
                            <Icon name="database" size={14} />
                            Generar backup
                        </Button>
                    </span>
                </div>
            </div>

            {(espacio.alertas.length > 0 || excedeTope) && (
                <div className="space-y-2">
                    {excedeTope && (
                        <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${estilosAlerta.warning}`}>
                            <Icon name="warning" size={15} className="mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">
                                Límite de backups excedido ({completados}/{espacio.backups.maximo}). Los backups
                                protegidos no se eliminan automáticamente: desproteja o elimine los que ya no necesite.
                            </p>
                        </div>
                    )}

                    {espacio.alertas.map((alerta, indice) => (
                        <div
                            key={`${alerta.nivel}-${indice}`}
                            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${estilosAlerta[alerta.nivel]}`}
                        >
                            <Icon name={iconoAlerta[alerta.nivel]} size={15} className="mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">{alerta.mensaje}</p>
                        </div>
                    ))}
                </div>
            )}

            <EstadoAlmacenamiento espacio={espacio} />

            <div className="flex items-center justify-between gap-2 border-b border-excel-border dark:border-gray-700">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setPestana('backups')}
                        className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                            pestana === 'backups'
                                ? 'border-excel-green text-excel-green'
                                : 'border-transparent text-excel-muted hover:text-excel-text dark:hover:text-gray-100'
                        }`}
                    >
                        <Icon name="database" size={14} />
                        Backups
                        <Badge variant="secondary">{backups.data.length}</Badge>
                    </button>

                    <span
                        title={
                            puede.editar
                                ? 'Configurar la frecuencia, retención y cuota'
                                : 'Sin permiso de edición para configurar la automatización'
                        }
                    >
                        <button
                            type="button"
                            disabled={!puede.editar}
                            onClick={() => setPestana('automatizacion')}
                            className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                pestana === 'automatizacion'
                                    ? 'border-excel-green text-excel-green'
                                    : 'border-transparent text-excel-muted hover:text-excel-text dark:hover:text-gray-100'
                            }`}
                        >
                            <Icon name="clock" size={14} />
                            Automatización
                            {automatizacion.habilitado && (
                                <Badge variant={automatizacion.habilitado ? 'success' : 'default'}>
                                    {automatizacion.frecuencia}
                                </Badge>
                            )}
                        </button>
                    </span>
                </div>

                <p className="hidden text-[11px] text-excel-muted sm:block">
                    {espacio.backups.cantidad} backup(s) · {espacio.backups.huerfanos} archivo(s) sin registrar
                </p>
            </div>

            {pestana === 'backups' ? (
                <div className="space-y-4">
                    <TablaBackups
                        backups={backups.data}
                        puede={puede}
                        onDescargar={acciones.descargar}
                        onRestaurar={acciones.abrirRestaurar}
                        onProteger={acciones.alternarProteccion}
                        onHistorial={acciones.abrirHistorial}
                        onEliminar={acciones.abrirEliminar}
                    />

                    {ultimosEventos.length > 0 && (
                        <Card padding="lg">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-excel-text dark:text-gray-100">
                                    <Icon name="history" size={15} />
                                    Actividad reciente
                                </h3>
                                <span className="text-[11px] text-excel-muted">Últimos eventos de auditoría</span>
                            </div>

                            <ul className="divide-y divide-excel-border text-xs dark:divide-gray-700">
                                {ultimosEventos.map((evento) => (
                                    <li
                                        key={evento.id}
                                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Badge variant={evento.accion === 'fallo' || evento.accion === 'eliminacion' ? 'danger' : 'secondary'}>
                                                {etiquetaAccion[evento.accion] ?? evento.accion}
                                            </Badge>
                                            <span className="truncate font-mono text-[11px] text-excel-muted" title={evento.backup_nombre}>
                                                {evento.backup_nombre}
                                            </span>
                                            <span className="text-[11px] text-excel-muted">· {evento.usuario}</span>
                                        </div>
                                        <span className="text-[11px] text-excel-muted">{evento.fecha ?? '—'}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            ) : puede.editar ? (
                <FormAutomatizacion automatizacion={automatizacion} />
            ) : (
                <Card padding="lg">
                    <p className="text-sm text-excel-muted">
                        No tienes permiso de edición para configurar la automatización de backups.
                    </p>
                </Card>
            )}

            {acciones.backupARestaurar && (
                <ModalRestaurar backup={acciones.backupARestaurar} onClose={acciones.cerrarRestaurar} />
            )}

            {acciones.modalArchivo && (
                <ModalRestaurarArchivo
                    limiteMb={limite_importacion_mb}
                    onClose={acciones.cerrarArchivo}
                />
            )}

            {acciones.backupAEliminar && (
                <ModalEliminar
                    backup={acciones.backupAEliminar}
                    onCerrar={acciones.cerrarEliminar}
                    onConfirmar={acciones.confirmarEliminar}
                />
            )}

            {acciones.backupHistorial && (
                <ModalHistorial
                    backup={acciones.backupHistorial}
                    eventos={acciones.eventos}
                    cargando={acciones.cargandoEventos}
                    error={acciones.errorEventos}
                    onCerrar={acciones.cerrarHistorial}
                />
            )}
        </div>
    );
}
