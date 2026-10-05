import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import type { Derivacion } from '@/types/generated/Tramite';

interface TramiteTimelineProps {
    derivaciones: Derivacion[];
}

const estadoColors: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    derivado: 'warning',
    recepcionado: 'success',
    rechazado: 'danger',
    historico: 'default',
};

const estadoLabels: Record<string, string> = {
    derivado: 'Derivado',
    recepcionado: 'Recepcionado',
    rechazado: 'Rechazado',
    historico: 'Histórico',
};

function nombre(usuario: Derivacion['derivado_de']): string {
    if (!usuario) return '—';
    const funcionario = (usuario as { funcionario?: { nombre?: string; apellidos?: string } | null }).funcionario;
    if (funcionario?.nombre) {
        return `${funcionario.nombre} ${funcionario.apellidos ?? ''}`.trim();
    }
    return usuario.name;
}

const columns: Column<Derivacion>[] = [
    {
        key: 'numero_derivacion',
        header: 'N°',
        cellClassName: 'text-center font-semibold',
        render: (d) => d.numero_derivacion,
    },
    {
        key: 'estado',
        header: 'Estado',
        render: (d) => (
            <Badge variant={estadoColors[d.estado] ?? 'default'}>
                {estadoLabels[d.estado] ?? d.estado}
            </Badge>
        ),
    },
    {
        key: 'de_para',
        header: 'De → Para',
        render: (d) => (
            <span className="whitespace-nowrap text-xs">
                {nombre(d.derivado_de)} <span className="text-gray-400">→</span> {nombre(d.derivado_a)}
            </span>
        ),
    },
    {
        key: 'fecha_derivacion',
        header: 'Derivación',
        render: (d) => <span className="whitespace-nowrap text-xs">{d.fecha_derivacion}</span>,
    },
    {
        key: 'glosa_derivacion',
        header: 'Glosa',
        render: (d) => <span className="line-clamp-2 max-w-xs text-xs">{d.glosa_derivacion ?? '—'}</span>,
    },
    {
        key: 'recepcion',
        header: 'Recepción',
        render: (d) => (
            <span className="text-xs">
                {d.fecha_recepcion ?? '—'}
                {d.glosa_recepcion ? <span className="block text-gray-500 dark:text-gray-400">{d.glosa_recepcion}</span> : null}
            </span>
        ),
    },
    {
        key: 'dias_en_derivacion',
        header: 'Días',
        cellClassName: 'text-center',
        render: (d) => d.dias_en_derivacion,
    },
];

export function TramiteTimeline({ derivaciones }: TramiteTimelineProps) {
    return (
        <Table
            columns={columns}
            data={derivaciones}
            keyExtractor={(d) => d.id}
            emptyMessage="Este trámite aún no tiene derivaciones registradas."
        />
    );
}
