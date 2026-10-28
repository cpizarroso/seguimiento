import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cambiarEstado } = vi.hoisted(() => ({ cambiarEstado: vi.fn() }));

vi.mock('@/services/userService', () => ({
    userService: { cambiarEstado },
}));

import { EstadoUsuarioModal, type EstadoUsuarioTarget } from '@/components/features/users/EstadoUsuarioModal';

const usuario: EstadoUsuarioTarget = {
    id: 7,
    nombre: 'Lucía Fernández',
    username: 'lfernandez',
    activo: true,
};

describe('EstadoUsuarioModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cambiarEstado.mockImplementation((_id, _activo, opciones) => opciones?.onSuccess?.());
    });

    it('pide confirmación para desactivar y envía activo=false', () => {
        const onClose = vi.fn();

        render(React.createElement(EstadoUsuarioModal, { user: usuario, onClose }));

        expect(screen.getByText('Desactivar usuario')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

        expect(cambiarEstado).toHaveBeenCalledWith(
            7,
            false,
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
        expect(onClose).toHaveBeenCalled();
    });

    it('activa a un usuario inactivo', () => {
        const onClose = vi.fn();

        render(React.createElement(EstadoUsuarioModal, {
            user: { ...usuario, activo: false },
            onClose,
        }));

        expect(screen.getByText('Activar usuario')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Activar' }));

        expect(cambiarEstado).toHaveBeenCalledWith(7, true, expect.anything());
        expect(onClose).toHaveBeenCalled();
    });

    it('muestra el error del servidor sin cerrar el modal', () => {
        const onClose = vi.fn();

        cambiarEstado.mockImplementation((_id, _activo, opciones) => {
            opciones?.onError?.({ activo: 'No puedes desactivar tu propia cuenta.' });
        });

        render(React.createElement(EstadoUsuarioModal, { user: usuario, onClose }));

        fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

        expect(screen.getByText('No puedes desactivar tu propia cuenta.')).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });
});
