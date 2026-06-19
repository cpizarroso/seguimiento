import type { Area } from './Tramite';

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
    fecha_ingreso: string | null;
    estado: string;
    area_id: number | null;
    area?: Area | null;
    creado_por?: { id: number; name: string; email: string } | null;
    created_at: string | null;
    updated_at: string | null;
}
