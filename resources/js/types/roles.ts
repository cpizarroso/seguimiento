export interface RolPermiso {
    id: number;
    modulo: string;
    modulo_nombre?: string;
    accion: string;
    accion_nombre?: string;
}

export interface RolRow {
    id: number;
    nombre: string;
    slug: string;
    descripcion: string | null;
    es_sistema: boolean;
    usuarios_count?: number;
    permiso_ids?: number[];
    permisos: RolPermiso[];
}

export interface RolData extends RolRow {
    permiso_ids: number[];
}

export interface PermisoOption {
    id: number;
    modulo: string;
    modulo_nombre: string;
    accion: string;
    accion_nombre: string;
}

export type PermisosAgrupados = Record<string, PermisoOption[]>;

export interface RolFormData {
    nombre: string;
    slug: string;
    descripcion: string;
    permiso_ids: number[];
}
