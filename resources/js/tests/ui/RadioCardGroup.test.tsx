import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RadioCardGroup, type RadioCardOption } from '@/components/ui/RadioCardGroup';

const opciones: RadioCardOption[] = [
    { value: 'aleatoria', label: 'Aleatoria', description: 'Letra + números', preview: 'X48213!' },
    { value: 'clasica', label: 'Clásica', preview: '1234567' },
    { value: 'ci', label: 'Cédula', preview: 'Sin CI', disabled: true, disabledReason: 'Sin CI registrada' },
];

describe('RadioCardGroup', () => {
    it('marca la opción seleccionada y avisa los cambios', () => {
        const onChange = vi.fn();

        render(
            React.createElement(RadioCardGroup, {
                name: 'sugerencia',
                label: 'Sugerencias',
                options: opciones,
                value: 'aleatoria',
                onChange,
            }),
        );

        expect(screen.getByRole('radiogroup', { name: 'Sugerencias' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /Aleatoria/ })).toBeChecked();
        expect(screen.getByText('X48213!')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('radio', { name: /Clásica/ }));

        expect(onChange).toHaveBeenCalledWith('clasica');
    });

    it('deshabilita las opciones no disponibles y muestra el error', () => {
        render(
            React.createElement(RadioCardGroup, {
                name: 'sugerencia',
                options: opciones,
                value: null,
                onChange: vi.fn(),
                error: 'Elige una sugerencia',
            }),
        );

        expect(screen.getByRole('radio', { name: /Cédula/ })).toBeDisabled();
        expect(screen.getByText('Elige una sugerencia')).toBeInTheDocument();
    });
});
