import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    useForm: (initial: Record<string, unknown>) => {
        const [data, setDataState] = useState<Record<string, unknown>>(initial);
        const [errors, setErrors] = useState<Record<string, string>>({});

        return {
            data,
            setData: (clave: string, valor: unknown) =>
                setDataState((anterior) => ({ ...anterior, [clave]: valor })),
            post,
            processing: false,
            errors,
            reset: vi.fn(),
            clearErrors: (clave?: string) =>
                setErrors((anterior) => {
                    if (!clave) return {};
                    const siguientes = { ...anterior };
                    delete siguientes[clave];
                    return siguientes;
                }),
            setError: (clave: string, mensaje: string) =>
                setErrors((anterior) => ({ ...anterior, [clave]: mensaje })),
            transform: vi.fn(),
        };
    },
}));

import { ModalSolicitarReasignacion } from '@/components/features/reasignaciones/ModalSolicitarReasignacion';

beforeEach(() => {
    post.mockClear();
});

describe('ModalSolicitarReasignacion', () => {
    it('envía la solicitud con el trámite y el motivo', () => {
        render(
            <ModalSolicitarReasignacion
                open
                onClose={vi.fn()}
                tramite={{ id: 5, numero_completo: 'DLA-0005/2026' }}
            />,
        );

        fireEvent.change(screen.getByLabelText(/motivo/i), {
            target: { value: 'Necesito revisar el expediente completo' },
        });

        fireEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }));

        expect(post).toHaveBeenCalledWith(
            '/reasignaciones',
            expect.objectContaining({ preserveScroll: true, onSuccess: expect.any(Function) }),
        );
    });

    it('avisa cuando el motivo es demasiado corto en vez de no hacer nada', () => {
        render(
            <ModalSolicitarReasignacion
                open
                onClose={vi.fn()}
                tramite={{ id: 5, numero_completo: 'DLA-0005/2026' }}
            />,
        );

        fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }));

        expect(post).not.toHaveBeenCalled();
        expect(screen.getByText('El motivo debe tener al menos 5 caracteres.')).toBeInTheDocument();
    });

    it('limpia el aviso al corregir el motivo', () => {
        render(
            <ModalSolicitarReasignacion
                open
                onClose={vi.fn()}
                tramite={{ id: 5, numero_completo: 'DLA-0005/2026' }}
            />,
        );

        fireEvent.change(screen.getByLabelText(/motivo/i), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: /enviar solicitud/i }));
        expect(screen.getByText('El motivo debe tener al menos 5 caracteres.')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/motivo/i), {
            target: { value: 'Necesito revisar el expediente completo' },
        });

        expect(
            screen.queryByText('El motivo debe tener al menos 5 caracteres.'),
        ).not.toBeInTheDocument();
    });
});
