import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { estado } = vi.hoisted(() => ({
    estado: { dominio: 'seguimiento.com' },
}));

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { dominio_usuario: estado.dominio } }),
}));

vi.mock('@/components/ui/SearchableSelect', () => ({
    SearchableSelect: ({ label, options, value, onChange }: any) =>
        React.createElement(
            'select',
            {
                'aria-label': label,
                value: value ?? '',
                onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value),
            },
            [
                React.createElement('option', { key: '', value: '' }, ''),
                ...(options ?? []).map((option: any) =>
                    React.createElement(
                        'option',
                        { key: option.value, value: option.value, disabled: option.disabled },
                        option.label,
                    ),
                ),
            ],
        ),
}));

import { UserForm, usernameDesdeEmail } from '@/components/features/users/UserForm';

const areas = {
    data: [
        { id: 7, nombre: 'Dirección Legal', codigo: 'DLA', activo: true },
        { id: 9, nombre: 'Administración', codigo: 'ADM', activo: true },
    ],
};

const personas = {
    data: [
        {
            id: 11,
            nombres: 'Carlos',
            apellidos: 'Mendoza',
            nombre_completo: 'Carlos Mendoza',
            ci: '1000001',
            telefono: null,
            correo: 'cmendoza@ejemplo.gob.bo',
            profesion: null,
            direccion: null,
            activo: true,
            puesto_activo: {
                id: 3,
                persona_id: 11,
                puesto_id: 9,
                fecha_inicio: null,
                fecha_fin: null,
                vigente: true,
                puesto: { id: 9, nombre: 'JEFE' },
            },
            area: { id: 7, nombre: 'Dirección Legal', codigo: 'DLA' },
            user: null,
        },
    ],
};

function Harness({ onCreated }: { onCreated?: (creado: any) => void } = {}) {
    const [data, setData] = useState({
        username: '',
        email: '',
        password: '',
        persona_id: '',
        role_ids: [] as number[],
        area_ids: [] as number[],
        area_predeterminada_id: '',
        permisos: [] as { permiso_id: number; permitido: boolean }[],
    });

    const form: any = {
        data,
        setData: (keyOrObject: any, value?: any) => {
            if (typeof keyOrObject === 'string') {
                setData((prev) => ({ ...prev, [keyOrObject]: value }));
            } else {
                setData((prev) => ({ ...prev, ...keyOrObject }));
            }
        },
        post: vi.fn((_url: string, opciones?: { onSuccess?: () => void }) => opciones?.onSuccess?.()),
        put: vi.fn(),
        processing: false,
        errors: {},
    };

    return (
        <UserForm
            form={form}
            areas={areas as any}
            roles={{ data: [] }}
            personas={personas as any}
            submitUrl="/users"
            onCreated={onCreated}
        />
    );
}

describe('UserForm áreas habilitadas', () => {
    it('marca automáticamente la primera área y permite cambiarla', () => {
        render(<Harness />);

        expect(screen.getByText('0 seleccionadas')).toBeInTheDocument();
        expect(screen.queryByLabelText(/Área predeterminada/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox', { name: /DLA/ }));

        expect(screen.getByText('1 seleccionada')).toBeInTheDocument();
        expect(screen.getByLabelText(/Área predeterminada/)).toHaveValue('7');

        fireEvent.click(screen.getByRole('checkbox', { name: /ADM/ }));

        expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();
        expect(screen.getByLabelText(/Área predeterminada/)).toHaveValue('7');

        fireEvent.change(screen.getByLabelText(/Área predeterminada/), { target: { value: '9' } });

        expect(screen.getByLabelText(/Área predeterminada/)).toHaveValue('9');
    });

    it('reasigna la predeterminada al desmarcar la elegida', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('checkbox', { name: /DLA/ }));
        fireEvent.click(screen.getByRole('checkbox', { name: /ADM/ }));

        fireEvent.click(screen.getByRole('checkbox', { name: /DLA/ }));

        expect(screen.getByText('1 seleccionada')).toBeInTheDocument();
        expect(screen.getByLabelText(/Área predeterminada/)).toHaveValue('9');
    });
});

describe('UserForm email de acceso', () => {    it('autocompleta el email con el dominio configurado al elegir la persona', () => {
        render(<Harness />);

        fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '11' } });

        expect(screen.getByLabelText(/^Email de acceso/)).toHaveValue('cmendoza@seguimiento.com');
        expect(screen.getByLabelText(/^Usuario/)).toHaveValue('cmendoza');
    });

    it('conserva el username escrito a mano al elegir la persona', () => {
        render(<Harness />);

        fireEvent.change(screen.getByLabelText(/^Usuario/), { target: { value: 'personalizado' } });
        fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '11' } });

        expect(screen.getByLabelText(/^Email de acceso/)).toHaveValue('cmendoza@seguimiento.com');
        expect(screen.getByLabelText(/^Usuario/)).toHaveValue('personalizado');
    });

    it('extrae la parte local del correo de la persona', () => {
        expect(usernameDesdeEmail('Carlos.Mendoza@ejemplo.gob.bo')).toBe('carlos.mendoza');
    });
});

describe('UserForm contraseña y reporte de acceso', () => {
    const anio = String(new Date().getFullYear()).slice(-2);

    it('ofrece las mismas sugerencias de contraseña que el reseteo', () => {
        render(<Harness />);

        const campo = screen.getByLabelText(/^Contraseña/) as HTMLInputElement;
        const inicial = campo.value;

        expect(screen.getByRole('radio', { name: /Aleatoria/ })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: /Clásica/ })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Cédula/ })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Nombre \+ año/ })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Generar contraseña aleatoria' }));

        expect(campo.value).toMatch(/^[A-Z]\d{5}[!@#$%&*\-_?]$/);
        expect(campo.value).not.toBe(inicial);
        expect(screen.getByRole('radio', { name: /Aleatoria/ })).toBeChecked();
    });

    it('rellena la contraseña al elegir cada sugerencia', () => {
        render(<Harness />);
        const campo = screen.getByLabelText(/^Contraseña/) as HTMLInputElement;

        fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '11' } });

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        expect(campo.value).toBe('1234567');

        fireEvent.click(screen.getByRole('radio', { name: /Cédula/ }));
        expect(campo.value).toBe('1000001');

        fireEvent.click(screen.getByRole('radio', { name: /Nombre \+ año/ }));
        expect(campo.value).toBe(`CMendoza${anio}`);
    });

    it('arma el reporte de acceso con los datos de la persona al crear', () => {
        const onCreated = vi.fn();

        render(<Harness onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText('Persona vinculada'), { target: { value: '11' } });
        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));
        fireEvent.submit(screen.getByRole('button', { name: 'Guardar' }).closest('form') as HTMLFormElement);

        expect(onCreated).toHaveBeenCalledTimes(1);

        const creado = onCreated.mock.calls[0][0];

        expect(creado).toMatchObject({ nombre: 'Carlos Mendoza', username: 'cmendoza' });
        expect(creado.reporte).toContain('Nombre completo: Carlos Mendoza');
        expect(creado.reporte).toContain('Cargo: JEFE');
        expect(creado.reporte).toContain('Área: DLA · Dirección Legal');
        expect(creado.reporte).toContain('Usuario: @cmendoza');
        expect(creado.reporte).toContain('Contraseña: 1234567');
        expect(creado.reporte).toContain('Se recomienda actualizar la contraseña');
    });
});
