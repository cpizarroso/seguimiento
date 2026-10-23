import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RangoCalendario } from '@/components/features/reporte/RangoCalendario';

function Harness({ onApply }: { onApply: (desde: string, hasta: string) => void }) {
    const [desde, setDesde] = useState('2026-10-01');
    const [hasta, setHasta] = useState('2026-10-23');

    return (
        <RangoCalendario
            desde={desde}
            hasta={hasta}
            onChange={(nuevoDesde, nuevoHasta) => {
                setDesde(nuevoDesde);
                setHasta(nuevoHasta);
            }}
            onApply={onApply}
        />
    );
}

describe('RangoCalendario', () => {
    it('muestra el rango seleccionado y aplica los cambios', () => {
        const onApply = vi.fn();

        render(<Harness onApply={onApply} />);

        expect(screen.getByText(/01\/10\/2026/)).toBeInTheDocument();
        expect(screen.getByText(/23\/10\/2026/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar rango de fechas/ }));
        fireEvent.click(screen.getByRole('button', { name: '10/10/2026' }));
        fireEvent.click(screen.getByRole('button', { name: '20/10/2026' }));
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

        expect(onApply).toHaveBeenCalledWith('2026-10-10', '2026-10-20');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('permite cerrar el calendario con Escape', () => {
        render(<Harness onApply={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: /Seleccionar rango de fechas/ }));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
