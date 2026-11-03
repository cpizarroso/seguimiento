import type { EstadoReasignacion } from '@/types/reasignaciones';

export const estadoReasignacionLabel: Record<EstadoReasignacion, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
};

export const estadoReasignacionColor: Record<
    EstadoReasignacion,
    'success' | 'warning' | 'info' | 'danger' | 'default'
> = {
    pendiente: 'warning',
    aprobada: 'success',
    rechazada: 'danger',
    cancelada: 'default',
};
