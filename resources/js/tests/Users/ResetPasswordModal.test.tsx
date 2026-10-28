import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resetPassword, estado } = vi.hoisted(() => ({
    resetPassword: vi.fn(),
    estado: { errors: {} as Record<string, string> },
}));

vi.mock('@/services/userService', () => ({
    userService: { resetPassword },
}));

vi.mock('@inertiajs/react', () => ({
    useForm: (initial: Record<string, unknown>) => {
        const [data, setDataState] = React.useState(initial);

        const setData = (key: string, value: unknown) => {
            setDataState((prev) => ({ ...prev, [key]: value }));
        };

        return {
            data,
            setData,
            processing: false,
            errors: estado.errors,
            clearErrors: vi.fn(),
        };
    },
}));

import {
    ResetPasswordModal,
    resetPasswordTarget,
    type ResetPasswordTarget,
} from '@/components/features/users/ResetPasswordModal';

const usuario: ResetPasswordTarget = {
    id: 7,
    nombre: 'Lucía Fernández Gómez',
    username: 'lfernandez',
    nombres: 'Lucía',
    apellidos: 'Fernández Gómez',
    ci: '8765432',
    cargo: 'JEFE',
    area: 'DLA · Dirección Legal',
};

const anio = String(new Date().getFullYear()).slice(-2);

function renderModal(onClose = vi.fn()) {
    render(React.createElement(ResetPasswordModal, { user: usuario, onClose }));

    return {
        onClose,
        campo: () => screen.getByLabelText(/^Contraseña/) as HTMLInputElement,
    };
}

describe('ResetPasswordModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        estado.errors = {};
        resetPassword.mockImplementation((_id, _datos, opciones) => {
            opciones?.onSuccess?.();
        });
    });

    it('abre con la contraseña aleatoria preseleccionada', () => {
        const { campo } = renderModal();

        expect(screen.getByRole('radio', { name: /Aleatoria/ })).toBeChecked();
        expect(campo().value).toMatch(/^[A-Z]\d{5}[!@#$%&*\-_?]$/);
    });

    it('rellena la contraseña al elegir cada sugerencia', () => {
        const { campo } = renderModal();

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        expect(campo().value).toBe('1234567');

        fireEvent.click(screen.getByRole('radio', { name: /Cédula/ }));
        expect(campo().value).toBe('8765432');

        fireEvent.click(screen.getByRole('radio', { name: /Nombre \+ año/ }));
        expect(campo().value).toBe(`LFernandez${anio}`);
    });

    it('genera otra contraseña aleatoria desde el icono del campo', () => {
        const { campo } = renderModal();
        const inicial = campo().value;

        fireEvent.click(screen.getByRole('button', { name: 'Generar contraseña aleatoria' }));

        expect(campo().value).toMatch(/^[A-Z]\d{5}[!@#$%&*\-_?]$/);
        expect(campo().value).not.toBe(inicial);
        expect(screen.getByRole('radio', { name: /Aleatoria/ })).toBeChecked();
    });

    it('muestra y oculta la contraseña con el icono del ojo', () => {
        const { campo } = renderModal();

        expect(campo()).toHaveAttribute('type', 'password');

        fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));

        expect(campo()).toHaveAttribute('type', 'text');

        fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));

        expect(campo()).toHaveAttribute('type', 'password');
    });

    it('desmarca la sugerencia cuando la contraseña se escribe a mano', () => {
        const { campo } = renderModal();

        fireEvent.change(campo(), { target: { value: 'Manual99' } });

        expect(campo().value).toBe('Manual99');
        expect(screen.getByRole('radio', { name: /Aleatoria/ })).not.toBeChecked();
    });

    it('envía la contraseña y su confirmación al guardar', () => {
        const { campo } = renderModal();

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        fireEvent.submit(campo().closest('form') as HTMLFormElement);

        expect(resetPassword).toHaveBeenCalledWith(
            7,
            { password: '1234567', password_confirmation: '1234567' },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('muestra el reporte copiable con los datos del usuario tras guardar', () => {
        const { campo } = renderModal();

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        fireEvent.submit(campo().closest('form') as HTMLFormElement);

        const reporte = screen.getByLabelText('Reporte de acceso');

        expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument();
        expect(reporte).toHaveTextContent('Nombre completo: Lucía Fernández Gómez');
        expect(reporte).toHaveTextContent('Cargo: JEFE');
        expect(reporte).toHaveTextContent('Área: DLA · Dirección Legal');
        expect(reporte).toHaveTextContent('Usuario: @lfernandez');
        expect(reporte).toHaveTextContent('Contraseña: 1234567');
        expect(reporte).toHaveTextContent('Se recomienda actualizar la contraseña');
    });

    it('copia el reporte al portapapeles', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        const { campo } = renderModal();

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        fireEvent.submit(campo().closest('form') as HTMLFormElement);
        fireEvent.click(screen.getByRole('button', { name: /Copiar reporte/ }));

        await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
        expect(writeText.mock.calls[0][0]).toContain('Contraseña: 1234567');
        expect(await screen.findByRole('button', { name: /Copiado/ })).toBeInTheDocument();
    });

    it('muestra el error del servidor y cierra con el botón Cancelar', () => {
        estado.errors = { password: 'La contraseña es obligatoria.' };
        const { onClose } = renderModal();

        expect(screen.getByText('La contraseña es obligatoria.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onClose).toHaveBeenCalled();
    });

    it('deshabilita la sugerencia de CI cuando la persona no tiene cédula', () => {
        render(
            React.createElement(ResetPasswordModal, {
                user: { ...usuario, ci: null },
                onClose: vi.fn(),
            }),
        );

        expect(screen.getByRole('radio', { name: /Cédula/ })).toBeDisabled();
    });
});

describe('resetPasswordTarget', () => {
    it('mapea la persona, el puesto vigente y su área', () => {
        const target = resetPasswordTarget({
            id: 3,
            name: 'Lucía Fernández Gómez',
            username: 'lfernandez',
            persona: {
                nombres: 'Lucía',
                apellidos: 'Fernández Gómez',
                nombre_completo: 'Lucía Fernández Gómez',
                ci: '8765432',
                area: { nombre: 'Dirección Legal', codigo: 'DLA' },
                puesto_activo: { puesto: { nombre: 'JEFE' } },
            },
        });

        expect(target).toEqual({
            id: 3,
            nombre: 'Lucía Fernández Gómez',
            username: 'lfernandez',
            nombres: 'Lucía',
            apellidos: 'Fernández Gómez',
            ci: '8765432',
            cargo: 'JEFE',
            area: 'DLA · Dirección Legal',
        });
    });

    it('usa los guiones cuando no hay puesto ni área', () => {
        const target = resetPasswordTarget({
            id: 4,
            name: 'Sin Persona',
            username: 'sin.persona',
            persona: null,
        });

        expect(target.cargo).toBeNull();
        expect(target.area).toBeNull();
        expect(target.ci).toBeNull();
    });
});
