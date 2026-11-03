import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TablaReasignaciones } from '@/components/features/reasignaciones/TablaReasignaciones';
import type { Reasignacion } from '@/types/reasignaciones';

function reasignacion(overrides: Partial<Reasignacion> = {}): Reasignacion {
    return {
        id: 1,
        estado: 'pendiente',
        motivo: 'Necesito el expediente',
        glosa_respuesta: null,
        fecha_resolucion: null,
        created_at: '03/11/2026 10:00',
        derivacion_id: null,
        puede_cancelar: false,
        tramite: {
            id: 8,
            numero_completo: 'DLA-0008/2026',
            descripcion: 'Trámite de prueba',
            estado: 'proceso',
            area: 'DLA',
            asignado: 'Otro Usuario',
        },
        solicitante: { id: 2, name: 'Solicitante Prueba' },
        resuelto_por: null,
        ...overrides,
    };
}

describe('TablaReasignaciones', () => {
    it('muestra aprobar y rechazar al resolutor para solicitudes pendientes', () => {
        const onAprobar = vi.fn();
        const onRechazar = vi.fn();
        const pendiente = reasignacion();

        render(
            <TablaReasignaciones
                reasignaciones={[pendiente]}
                puedeResolver
                procesando={null}
                onAprobar={onAprobar}
                onRechazar={onRechazar}
                onCancelar={vi.fn()}
            />,
        );

        expect(screen.getByText('DLA-0008/2026')).toBeInTheDocument();
        expect(screen.getByText('Solicitante Prueba')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

        expect(onAprobar).toHaveBeenCalledWith(pendiente);
        expect(onRechazar).toHaveBeenCalledWith(pendiente);
    });

    it('no muestra acciones de resolución a quien no puede resolver', () => {
        render(
            <TablaReasignaciones
                reasignaciones={[reasignacion()]}
                puedeResolver={false}
                procesando={null}
                onAprobar={vi.fn()}
                onRechazar={vi.fn()}
                onCancelar={vi.fn()}
            />,
        );

        expect(screen.queryByRole('button', { name: 'Aprobar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
    });

    it('permite cancelar solo cuando la fila lo habilita', () => {
        const onCancelar = vi.fn();

        render(
            <TablaReasignaciones
                reasignaciones={[reasignacion({ puede_cancelar: true })]}
                puedeResolver={false}
                procesando={null}
                onAprobar={vi.fn()}
                onRechazar={vi.fn()}
                onCancelar={onCancelar}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onCancelar).toHaveBeenCalledTimes(1);
    });
});
