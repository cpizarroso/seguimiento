export interface Tramite {
    id: number;
    numero_tramite: number;
    numero_formateado: string;
    year: number;
    fecha: string;
    descripcion: string;
    numero_diamante: string | null;
    glosa: string | null;
    estado: string;
    ultima_respuesta: string | null;
    puesto: Puesto | null;
    creador: Funcionario | null;
    asignado: Funcionario | null;
    derivaciones: Derivacion[];
}

export interface Puesto {
    id: number;
    nombre: string;
    descripcion: string | null;
    funcionarios_count?: number;
}

export interface Funcionario {
    id: number;
    nombre: string;
    email: string | null;
    puesto: Puesto | null;
}

export interface Derivacion {
    id: number;
    numero_derivacion: number;
    derivado_de: Funcionario | null;
    derivado_a: Funcionario | null;
    fecha_derivacion: string;
    glosa_derivacion: string | null;
    fecha_recepcion: string | null;
    glosa_recepcion: string | null;
    estado: string;
    dias_en_derivacion: number;
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
    puesto: Puesto;
    contador: {
        id: number;
        year: number;
        ultimo_numero: number;
        reset_glosa: string | null;
        ultimo_reset_at: string | null;
    } | null;
}
