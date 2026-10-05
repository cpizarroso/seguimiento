import type { User } from './User';

export interface Tramite {
    id: number;
    numero_tramite: number;
    numero_formateado: string;
    numero_completo: string;
    year: number;
    fecha: string;
    descripcion: string;
    numero_diamante: string | null;
    estado: string;
    urgente: boolean;
    ultima_respuesta: string | null;
    dias_transcurridos?: number;
    area: Area | null;
    area_id: number;
    creador: User | null;
    asignado: User | null;
    derivaciones: Derivacion[];
    actuaciones: Actuacion[];
}

export interface Area {
    id: number;
    nombre: string;
    descripcion: string | null;
    sigla: string;
    codigo: string | null;
    estado: boolean;
    parent_id: number | null;
    parent: Area | null;
    children?: Area[];
    puestos_count?: number;
    puestos?: Puesto[];
}

export interface AreaTreeNode extends Omit<Area, 'parent' | 'children' | 'puestos'> {
    parent: AreaTreeNode | null;
    children: AreaTreeNode[];
    puestos: Puesto[];
}

export interface Puesto {
    id: number;
    nombre: string;
    descripcion: string | null;
    sigla: string;
    codigo: string | null;
    estado: boolean;
    area_id: number | null;
    area: Area | null;
    funcionarios_count?: number;
}

export interface Derivacion {
    id: number;
    numero_derivacion: number;
    derivado_de: User | null;
    derivado_a: User | null;
    fecha_derivacion: string;
    glosa_derivacion: string | null;
    fecha_recepcion: string | null;
    glosa_recepcion: string | null;
    estado: string;
    dias_en_derivacion: number;
    actuaciones: Actuacion[];
}

export interface Actuacion {
    id: number;
    derivacion_id: number;
    glosa: string;
    fecha_actuacion: string;
    dias_transcurridos: number;
    area: Area | null;
    area_id: number | null;
    funcionario: FuncionarioListItem | null;
    funcionario_id: number | null;
    created_at: string;
}

export interface FuncionarioListItem {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    area_id: number | null;
    area: Area | null;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface PaginatedData<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface ContadorInfo {
    area: Area;
    contador: {
        id: number;
        year: number;
        ultimo_numero: number;
        reset_glosa: string | null;
        ultimo_reset_at: string | null;
    } | null;
}
