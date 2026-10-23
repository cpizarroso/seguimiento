import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/SearchableSelect', () => ({
    SearchableSelect: ({ label }: { label?: string }) => React.createElement('div', null, label),
}));

import { UserForm } from '@/components/features/users/UserForm';

const areas = {
    data: [
        { id: 7, nombre: 'Dirección Legal', codigo: 'DLA', activo: true },
        { id: 9, nombre: 'Administración', codigo: 'ADM', activo: true },
    ],
};

function Harness() {
    const [data, setData] = useState({
        name: '',
        email: '',
        phone: '',
        profesion: '',
        password: '',
        persona_id: '',
        role_ids: [] as number[],
        area_ids: [] as number[],
        area_predeterminada_id: '',
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
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
    };

    return (
        <UserForm
            form={form}
            areas={areas as any}
            roles={{ data: [] }}
            personas={{ data: [] }}
            submitUrl="/users"
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
