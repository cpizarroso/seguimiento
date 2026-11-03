import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Reasignacion, ReasignacionesIndexProps } from '@/types/reasignaciones';

const { filtrar, aprobar } = vi.hoisted(() => ({
    filtrar: vi.fn(),
    aprobar: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) =>
        React.createElement('a', { href }, children),
    useForm: (initial: Record<string, unknown>) => ({
        data: initial,
        setData: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
        reset: vi.fn(),
        clearErrors: vi.fn(),
        transform: vi.fn(),
        setError: vi.fn(),
    }),
}));

vi.mock('@/hooks/useReasignaciones', () => ({
    useReasignaciones: () => ({
        procesando: null,
        aprobar,
        rechazar: vi.fn(),
        cancelar: vi.fn(),
        filtrar,
    }),
}));

import ReasignacionesIndex from '@/pages/Reasignaciones/Index';

const reasignacion: Reasignacion = {
    id: 1,
    estado: 'pendiente',
    motivo: 'Necesito el expediente',
    glosa_respuesta: null,
    fecha_resolucion: null,
    created_at: '03/11/2026 10:00',
    derivacion_id: null,
    puede_cancelar: true,
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
};

const props: ReasignacionesIndexProps = {
    reasignaciones: {
        data: [reasignacion],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1, from: 1, to: 1 },
    },
    puede_resolver: true,
    filtros: { estado: '', search: '' },
};

beforeEach(() => {
    filtrar.mockClear();
    aprobar.mockClear();
});

describe('Reasignaciones/Index', () => {
    it('lista las solicitudes con su trámite y solicitante', () => {
        render(<ReasignacionesIndex {...props} />);

        expect(screen.getByText('DLA-0008/2026')).toBeInTheDocument();
        expect(screen.getByText('Solicitante Prueba')).toBeInTheDocument();
        expect(screen.getByText('1 solicitud', { exact: false })).toBeInTheDocument();
    });

    it('filtra por estado al pulsar un chip', () => {
        render(<ReasignacionesIndex {...props} />);

        fireEvent.click(screen.getByLabelText('Pendiente'));

        expect(filtrar).toHaveBeenCalledWith({ estado: 'pendiente', search: '', page: 1 });
    });

    it('abre el modal de resolución al aprobar', () => {
        render(<ReasignacionesIndex {...props} />);

        fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));

        expect(screen.getByText('Aprobar reasignación')).toBeInTheDocument();
    });
});
