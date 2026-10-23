import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import type { Derivacion, Persona } from '@/types/generated/Tramite';

interface TramiteTimelineProps {
    derivaciones: Derivacion[];
}

type UsuarioDerivacion = NonNullable<Derivacion['derivado_de']> & {
    persona?: Persona | null;
};

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

function nombre(usuario: UsuarioDerivacion | null): string {
    if (!usuario) return '—';

    const persona = usuario.persona;

    if (persona?.nombre_completo) {
        return persona.nombre_completo;
    }

    if (persona?.nombres) {
        return `${persona.nombres} ${persona.apellidos ?? ''}`.trim();
    }

    return usuario.name;
}

function detalle(usuario: UsuarioDerivacion | null): string {
    const persona = usuario?.persona;
    const puesto = persona?.puesto_activo?.puesto?.nombre ?? null;
    const area = persona?.area;
    const areaTexto = area ? `${area.codigo} - ${area.nombre}` : null;

    return [puesto, areaTexto].filter(Boolean).join(' · ');
}

function UsuarioCelda({ usuario }: { usuario: UsuarioDerivacion | null }) {
    const descripcion = detalle(usuario);

    return (
        <div className="min-w-[12rem] text-xs">
            <div className="font-medium text-gray-900 dark:text-gray-100">{nombre(usuario)}</div>
            {descripcion ? (
                <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{descripcion}</div>
            ) : null}
        </div>
    );
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
        key: 'derivado_de',
        header: 'Deriva',
        render: (d) => <UsuarioCelda usuario={d.derivado_de} />,
    },
    {
        key: 'derivado_a',
        header: 'Recibe',
        render: (d) => <UsuarioCelda usuario={d.derivado_a} />,
    },
    {
        key: 'fecha_derivacion',
        header: 'Fecha derivación',
        render: (d) => <span className="whitespace-nowrap text-xs">{d.fecha_derivacion}</span>,
    },
    {
        key: 'fecha_recepcion',
        header: 'Fecha recepción',
        render: (d) => <span className="whitespace-nowrap text-xs">{d.fecha_recepcion ?? '—'}</span>,
    },
    {
        key: 'glosa_derivacion',
        header: 'Glosa',
        render: (d) => (
            <div className="max-w-xs text-xs">
                <span className="line-clamp-2">{d.glosa_derivacion ?? '—'}</span>
                {d.glosa_recepcion ? (
                    <span className="mt-1 block line-clamp-2 text-gray-500 dark:text-gray-400">
                        {d.glosa_recepcion}
                    </span>
                ) : null}
            </div>
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
