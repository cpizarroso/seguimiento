import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SelectorFechaHora, fechaHoraActual } from '@/components/ui/SelectorFechaHora';

function Harness({
    inicial = '2026-10-30T12:30',
    onChange,
}: {
    inicial?: string;
    onChange?: (valor: string) => void;
}) {
    const [valor, setValor] = useState(inicial);

    return (
        <SelectorFechaHora
            value={valor}
            onChange={(nuevo) => {
                setValor(nuevo);
                onChange?.(nuevo);
            }}
        />
    );
}

describe('SelectorFechaHora', () => {
    it('fechaHoraActual devuelve el formato YYYY-MM-DDTHH:mm', () => {
        expect(fechaHoraActual()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('muestra el valor formateado y el placeholder cuando está vacío', () => {
        render(<Harness />);

        expect(screen.getByRole('button', { name: /Seleccionar fecha y hora/ })).toHaveTextContent('30/10/2026 12:30');

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar fecha y hora/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(screen.getByRole('button', { name: /Seleccionar fecha y hora/ })).toHaveTextContent('Seleccionar fecha y hora…');
    });

    it('abre el calendario y aplica el mismo valor sin cambios', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar fecha y hora/ }));

        const dialogo = screen.getByRole('dialog', { name: 'Calendario de fecha y hora' });
        expect(within(dialogo).getByText('Octubre 2026')).toBeInTheDocument();

        fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar' }));

        expect(onChange).toHaveBeenCalledWith('2026-10-30T12:30');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('permite elegir otro día y hora del pasado', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar fecha y hora/ }));

        const dialogo = screen.getByRole('dialog', { name: 'Calendario de fecha y hora' });

        fireEvent.click(within(dialogo).getByRole('button', { name: /15\/10\/2026/ }));
        fireEvent.change(within(dialogo).getByLabelText('Hora'), { target: { value: '8' } });
        fireEvent.change(within(dialogo).getByLabelText('Minuto'), { target: { value: '45' } });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar' }));

        expect(onChange).toHaveBeenCalledWith('2026-10-15T08:45');
    });

    it('el botón Ahora usa la fecha y hora del sistema', () => {
        const onChange = vi.fn();
        const esperado = fechaHoraActual();

        render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar fecha y hora/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Ahora' }));

        expect(onChange).toHaveBeenCalledWith(esperado);
    });

    it('deshabilita los días futuros', () => {
        render(<Harness inicial={fechaHoraActual()} />);

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar fecha y hora/ }));

        const dialogo = screen.getByRole('dialog', { name: 'Calendario de fecha y hora' });
        fireEvent.click(within(dialogo).getByRole('button', { name: 'Mes siguiente' }));

        expect(within(dialogo).getByRole('button', { name: /15\/11\/2026/ })).toBeDisabled();
    });
});
