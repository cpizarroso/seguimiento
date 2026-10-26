import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Table, type Column } from '@/components/ui/Table';
import { etiquetaEstado, etiquetaTipo, formatearMb, varianteEstado, varianteTipo } from './formato';
import type { Backup, PuedeBackups } from '@/types/backups';

interface Props {
    backups: Backup[];
    puede: PuedeBackups;
    onDescargar: (backup: Backup) => void;
    onRestaurar: (backup: Backup) => void;
    onProteger: (backup: Backup) => void;
    onHistorial: (backup: Backup) => void;
    onEliminar: (backup: Backup) => void;
}

interface AccionProps {
    icon: 'download' | 'restore' | 'lock' | 'unlock' | 'history' | 'trash';
    label: string;
    habilitado: boolean;
    motivo?: string;
    variante?: 'ghost' | 'danger';
    onClick: () => void;
}

function Accion({ icon, label, habilitado, motivo, variante = 'ghost', onClick }: AccionProps) {
    return (
        <span title={habilitado ? label : motivo ?? 'Sin permiso para esta acción'} className="inline-flex">
            <Button
                type="button"
                size="sm"
                variant={variante}
                disabled={!habilitado}
                aria-label={label}
                onClick={onClick}
                className="px-2"
            >
                <Icon name={icon} size={14} />
            </Button>
        </span>
    );
}

export function TablaBackups({
    backups,
    puede,
    onDescargar,
    onRestaurar,
    onProteger,
    onHistorial,
    onEliminar,
}: Props) {
    const columnas: Column<Backup>[] = [
        {
            key: 'nombre',
            header: 'Nombre',
            render: (backup) => (
                <div className="max-w-[280px]">
                    <p className="truncate font-mono text-[12px] font-medium" title={backup.nombre}>
                        {backup.nombre}
                    </p>
                    {backup.nombre_original && (
                        <p className="truncate text-[11px] text-excel-muted" title={backup.nombre_original}>
                            Original: {backup.nombre_original}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (backup) => <Badge variant={varianteTipo[backup.tipo]}>{etiquetaTipo[backup.tipo]}</Badge>,
        },
        {
            key: 'estado',
            header: 'Estado',
            render: (backup) => (
                <span title={backup.error ?? undefined} className="inline-flex">
                    <Badge variant={varianteEstado[backup.estado]}>{etiquetaEstado[backup.estado]}</Badge>
                </span>
            ),
        },
        {
            key: 'creado_en',
            header: 'Fecha',
            render: (backup) => (
                <span className="whitespace-nowrap text-xs">{backup.creado_en ?? '—'}</span>
            ),
        },
        {
            key: 'autor',
            header: 'Autor',
            render: (backup) => <span className="text-xs">{backup.autor ?? 'Sistema'}</span>,
        },
        {
            key: 'tamano',
            header: 'Tamaño',
            cellClassName: 'whitespace-nowrap',
            render: (backup) => <span className="text-xs">{formatearMb(backup.tamano_mb)}</span>,
        },
        {
            key: 'protegido',
            header: 'Protegido',
            render: (backup) => (
                <span
                    className="inline-flex items-center gap-1 text-xs"
                    title={backup.protegido ? 'No se elimina por retención' : 'Se elimina por retención'}
                >
                    <Icon
                        name={backup.protegido ? 'lock' : 'unlock'}
                        size={14}
                        className={backup.protegido ? 'text-excel-gold' : 'text-excel-muted/60'}
                    />
                    {backup.protegido ? 'Sí' : 'No'}
                </span>
            ),
        },
        {
            key: 'acciones',
            header: 'Acciones',
            headClassName: 'text-right',
            cellClassName: 'text-right',
            render: (backup) => (
                <div className="inline-flex items-center gap-1">
                    <Accion
                        icon="download"
                        label="Descargar"
                        habilitado={puede.descargar && backup.archivo_existe && backup.estado === 'completado'}
                        motivo="Sin archivo disponible o sin permiso de descarga"
                        onClick={() => onDescargar(backup)}
                    />
                    <Accion
                        icon="restore"
                        label="Restaurar"
                        habilitado={puede.restaurar && backup.estado === 'completado'}
                        motivo="Solo se pueden restaurar backups completados y con permiso"
                        onClick={() => onRestaurar(backup)}
                    />
                    <Accion
                        icon={backup.protegido ? 'unlock' : 'lock'}
                        label={backup.protegido ? 'Desproteger' : 'Proteger'}
                        habilitado={puede.editar}
                        motivo="Sin permiso de edición"
                        onClick={() => onProteger(backup)}
                    />
                    <Accion
                        icon="history"
                        label="Historial"
                        habilitado
                        onClick={() => onHistorial(backup)}
                    />
                    <Accion
                        icon="trash"
                        label="Eliminar"
                        variante="danger"
                        habilitado={puede.eliminar && !backup.protegido}
                        motivo="Sin permiso de baja o backup protegido"
                        onClick={() => onEliminar(backup)}
                    />
                </div>
            ),
        },
    ];

    return (
        <Table
            columns={columnas}
            data={backups}
            keyExtractor={(backup) => backup.id}
            emptyMessage="Todavía no hay backups. Genere el primero con el botón «Generar backup»."
        />
    );
}
