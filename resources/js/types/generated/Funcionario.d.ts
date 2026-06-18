import type { Tramite } from './Tramite';

export interface Funcionario {
    id: number;
    nombre: string;
    apellidos: string | null;
    email: string | null;
    direccion: string | null;
    nro_telefono: string | null;
    cedula_identidad: string | null;
    tipo_funcionario: string;
    nivel: string | null;
    area_id: number | null;
    area?: import('./Tramite').Area | null;
    tramites_count?: number;
    tramites?: Tramite[];
    created_at: string | null;
    updated_at: string | null;
}
