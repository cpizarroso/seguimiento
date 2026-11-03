import { useState } from 'react';
import { reasignacionService } from '@/services/reasignacionService';
import type { Reasignacion } from '@/types/reasignaciones';

export function useReasignaciones() {
    const [procesando, setProcesando] = useState<string | null>(null);

    const solicitar = (tramiteId: number, motivo: string, onSuccess?: () => void) => {
        setProcesando('solicitar');

        reasignacionService.solicitar(
            { tramite_id: tramiteId, motivo },
            {
                onSuccess: () => onSuccess?.(),
                onFinish: () => setProcesando(null),
            },
        );
    };

    const aprobar = (reasignacion: Reasignacion, glosa: string, onSuccess?: () => void) => {
        setProcesando(`aprobar-${reasignacion.id}`);

        reasignacionService.aprobar(reasignacion.id, glosa, {
            onSuccess: () => onSuccess?.(),
            onFinish: () => setProcesando(null),
        });
    };

    const rechazar = (reasignacion: Reasignacion, glosa: string, onSuccess?: () => void) => {
        setProcesando(`rechazar-${reasignacion.id}`);

        reasignacionService.rechazar(reasignacion.id, glosa, {
            onSuccess: () => onSuccess?.(),
            onFinish: () => setProcesando(null),
        });
    };

    const cancelar = (reasignacion: Reasignacion, onSuccess?: () => void) => {
        setProcesando(`cancelar-${reasignacion.id}`);

        reasignacionService.cancelar(reasignacion.id, {
            onSuccess: () => onSuccess?.(),
            onFinish: () => setProcesando(null),
        });
    };

    const filtrar = (params: Record<string, string | number | undefined>) => {
        reasignacionService.listar(params);
    };

    return { procesando, solicitar, aprobar, rechazar, cancelar, filtrar };
}
