import type { EstadoBackup, TipoBackup } from '@/types/backups';

export function formatearBytes(bytes: number | null): string {
    if (bytes === null || bytes <= 0) return '0 MB';

    const mb = bytes / 1048576;

    if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;

    return `${mb.toFixed(2)} MB`;
}

export function formatearMb(mb: number | null): string {
    if (mb === null || mb <= 0) return '0 MB';

    return `${mb.toFixed(2)} MB`;
}

export const etiquetaTipo: Record<TipoBackup, string> = {
    manual: 'Manual',
    automatico: 'Automático',
    pre_restauracion: 'Pre-restauración',
    importado: 'Importado',
};

export const etiquetaEstado: Record<EstadoBackup, string> = {
    en_proceso: 'En proceso',
    completado: 'Completado',
    fallido: 'Fallido',
};

export const varianteTipo: Record<TipoBackup, 'default' | 'info' | 'warning' | 'success'> = {
    manual: 'info',
    automatico: 'success',
    pre_restauracion: 'warning',
    importado: 'default',
};

export const varianteEstado: Record<EstadoBackup, 'default' | 'success' | 'warning' | 'danger'> = {
    en_proceso: 'warning',
    completado: 'success',
    fallido: 'danger',
};

export const etiquetaAccion: Record<string, string> = {
    creacion: 'Creación',
    eliminacion: 'Eliminación',
    descarga: 'Descarga',
    restauracion: 'Restauración',
    fallo: 'Fallo',
    carga_externa: 'Carga externa',
};
