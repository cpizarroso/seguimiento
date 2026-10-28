export type TipoBackup = 'manual' | 'automatico' | 'pre_restauracion' | 'importado';

export type EstadoBackup = 'en_proceso' | 'completado' | 'fallido';

export type NivelAlerta = 'info' | 'warning' | 'danger';

export interface Backup {
    id: number;
    nombre: string;
    nombre_original: string | null;
    tipo: TipoBackup;
    estado: EstadoBackup;
    protegido: boolean;
    tamano_bytes: number | null;
    tamano_mb: number | null;
    hash_sha256: string | null;
    error: string | null;
    autor: string | null;
    autor_id: number | null;
    creado_en: string | null;
    creado_iso: string | null;
    url_descarga: string;
    archivo_existe: boolean;
}

export interface DiscoEstado {
    disponible: boolean;
    ruta: string;
    total_bytes: number | null;
    usado_bytes: number | null;
    libre_bytes: number | null;
    porcentaje_usado: number | null;
}

export interface ArchivoBackup {
    id: number;
    nombre: string;
    fecha: string | null;
    tamano_mb: number;
    tipo: TipoBackup;
}

export interface AlertaBackup {
    nivel: NivelAlerta;
    mensaje: string;
}

export interface EspacioBackups {
    disco: DiscoEstado;
    backups: {
        cantidad: number;
        total_bytes: number;
        cuota_bytes: number;
        porcentaje_cuota: number | null;
        huerfanos: number;
        archivos_huerfanos: string[];
        maximo: number;
    };
    archivos: ArchivoBackup[];
    proyeccion: {
        backups_hasta_cuota: number | null;
        tendencia_mb_por_backup: number;
    };
    alertas: AlertaBackup[];
    estado: 'normal' | 'atencion' | 'critico';
}

export interface Automatizacion {
    habilitado: boolean;
    frecuencia: 'diaria' | 'semanal' | 'mensual';
    hora: string;
    dia_semana: number;
    dia_mes: number;
    maximo: number;
    cuota_mb: number;
    alerta_porcentaje: number;
    destino: string | null;
    ultima_ejecucion: string | null;
    proxima_ejecucion: string | null;
    habilitado_en: string | null;
}

export interface DiscoDestino {
    id: string;
    etiqueta: string;
    ruta: string;
    libre_bytes: number | null;
    total_bytes: number | null;
}

export interface EventoBackup {
    id: number;
    backup_nombre: string;
    accion: string;
    usuario: string;
    ip: string | null;
    detalle: string | null;
    fecha: string | null;
}

export interface PuedeBackups {
    crear: boolean;
    editar: boolean;
    eliminar: boolean;
    descargar: boolean;
    restaurar: boolean;
}

export interface BackupsIndexProps {
    backups: { data: Backup[] };
    espacio: EspacioBackups;
    automatizacion: Automatizacion;
    historial: EventoBackup[];
    puede: PuedeBackups;
    limite_importacion_mb: number;
    destinos: DiscoDestino[];
    destino_actual: string | null;
    ruta_predeterminada: string;
}
