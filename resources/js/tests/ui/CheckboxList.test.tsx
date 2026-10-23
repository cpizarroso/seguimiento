import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckboxList, type CheckboxListItem } from '@/components/ui/CheckboxList';

const items: CheckboxListItem[] = [
    { value: '7', label: 'DLA · Dirección Legal' },
    { value: '9', label: 'ADM · Administración' },
    { value: '11', label: 'LEG · Legal' },
];

function Harness({ initial = [] as string[] }) {
    const [selected, setSelected] = useState<string[]>(initial);

    return (
        <CheckboxList
            label="Áreas habilitadas"
            items={items}
            selected={selected}
            onChange={setSelected}
            searchPlaceholder="Filtrar áreas"
        />
    );
}

describe('CheckboxList', () => {
    it('muestra el contador de seleccionadas', () => {
        render(<Harness />);

        expect(screen.getByText('0 seleccionadas')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox', { name: /DLA/ }));

        expect(screen.getByText('1 seleccionada')).toBeInTheDocument();
    });

    it('filtra las opciones sin perder la selección', () => {
        render(<Harness initial={['7']} />);

        fireEvent.change(screen.getByLabelText('Filtrar áreas'), { target: { value: 'ADM' } });

        expect(screen.queryByText('DLA · Dirección Legal')).not.toBeInTheDocument();
        expect(screen.getByText('ADM · Administración')).toBeInTheDocument();
        expect(screen.getByText('1 seleccionada')).toBeInTheDocument();
    });

    it('selecciona todas las opciones visibles', () => {
        render(<Harness />);

        fireEvent.change(screen.getByLabelText('Filtrar áreas'), { target: { value: 'ADM' } });
        fireEvent.click(screen.getByRole('button', { name: 'Seleccionar visibles' }));

        expect(screen.getByText('1 seleccionada')).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /ADM/ })).toBeChecked();
    });

    it('limpia todas las selecciones', () => {
        render(<Harness initial={['7', '9']} />);

        expect(screen.getByText('2 seleccionadas')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(screen.getByText('0 seleccionadas')).toBeInTheDocument();
    });
});
