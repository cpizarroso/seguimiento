export interface DestinatarioDerivacion {
    user_id: number;
    name: string;
    persona: string | null;
    area_id: number;
    area_codigo: string;
    area_nombre: string;
}

/**
 * Resumen compacto de un trámite para mostrarlo antes de derivar o recepcionar.
 */
export interface TramiteResumenDerivacion {
    id: number;
    numero_completo: string;
    fecha: string | null;
    descripcion: string;
    area: string | null;
    derivacion_numero: number | null;
    derivacion_fecha: string | null;
    derivado_de: string | null;
}
