import type { User } from './User';

export interface Tramite {
    id: number;
    numero_tramite: number;
    numero_formateado: string;
    numero_completo: string;
    year: number;
    fecha: string;
    created_at: string;
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
    codigo: string;
    activo: boolean;
    area_padre_id: number | null;
    user_id: number | null;
    responsable?: { id: number; name: string; email: string } | null;
    children?: Area[];
    children_count?: number;
    puestos_count?: number;
    personas_count?: number;
    usuarios_count?: number;
    puestos?: Puesto[];
    created_at?: string;
}

export interface AreaTreeNode extends Omit<Area, 'children' | 'puestos'> {
    children: AreaTreeNode[];
    puestos: Puesto[];
}

export interface AreaOpcion {
    id: number;
    nombre: string;
    codigo: string;
    path: string;
    depth: number;
    activo: boolean;
    disabled: boolean;
}

export interface Puesto {
    id: number;
    nombre: string;
    descripcion: string | null;
    codigo: string;
    activo: boolean;
    area_id: number;
    area?: Area | null;
    personas_count?: number;
    usuarios_count?: number;
}

export interface Persona {
    id: number;
    nombres: string;
    apellidos: string;
    nombre_completo: string;
    ci: string;
    telefono: string | null;
    correo: string | null;
    direccion: string | null;
    activo: boolean;
    puesto_activo: PersonaPuesto | null;
    area: { id: number; nombre: string; codigo: string } | null;
    user: { id: number; name: string; email: string } | null;
    historial_puestos?: PersonaPuesto[];
    created_at?: string;
}

export interface PersonaPuesto {
    id: number;
    persona_id: number;
    puesto_id: number;
    puesto: Puesto | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    vigente: boolean;
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
    persona: Persona | null;
    persona_id: number | null;
    created_at: string;
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
