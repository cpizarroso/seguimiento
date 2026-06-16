import type { Tramite } from './Tramite';

export interface Funcionario {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    cargo: string;
    activo: boolean;
    tramites_count?: number;
    tramites?: Tramite[];
    created_at: string | null;
    updated_at: string | null;
}
