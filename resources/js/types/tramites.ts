export interface SecuenciaTramite {
    /** Último número emitido para el área y la gestión vigente. */
    ultimo_numero: number;
    /** Versión formateada del último número (`CODIGO-0000/AÑO`), o null si aún no hay trámites. */
    ultimo_completo: string | null;
    /** Número que se asignaría al guardar. */
    siguiente: number;
    /** Siguiente número formateado (`CODIGO-0000/AÑO`). */
    numero_completo: string;
}

/** Secuencias indexadas por `area_id` (las claves llegan como string desde Inertia). */
export type SecuenciasPorArea = Record<string, SecuenciaTramite>;
