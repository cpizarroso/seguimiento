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
    puesto_id?: number | null;
    puesto?: { id: number; nombre: string; sigla: string; codigo: string | null } | null;
    creado_por?: { id: number; name: string; email: string } | null;
    usuario?: { id: number; name: string; email: string } | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface FuncionarioPuesto {
    id: number;
    funcionario_id: number;
    puesto_id: number;
    puesto?: { id: number; nombre: string; sigla: string; codigo: string | null } | null;
    area_id: number | null;
    area?: { id: number; nombre: string; sigla: string } | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    es_vigente: boolean;
    creado_por?: { id: number; name: string; email: string } | null;
}
