import type { PaginatedData } from '@/types/generated/Tramite';

export type EstadoReasignacion = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';

export interface ReasignacionTramite {
    id: number;
    numero_completo: string;
    descripcion: string;
    estado: string;
    area: string | null;
    asignado: string | null;
}

export interface ReasignacionUsuario {
    id: number;
    name: string;
}

export interface Reasignacion {
    id: number;
    estado: EstadoReasignacion;
    motivo: string;
    glosa_respuesta: string | null;
    fecha_resolucion: string | null;
    created_at: string | null;
    derivacion_id: number | null;
    puede_cancelar: boolean;
    tramite?: ReasignacionTramite;
    solicitante?: ReasignacionUsuario;
    resuelto_por?: ReasignacionUsuario | null;
}

export interface ReasignacionesIndexProps {
    reasignaciones: PaginatedData<Reasignacion>;
    puede_resolver: boolean;
    filtros: {
        estado: string;
        search: string;
    };
}
