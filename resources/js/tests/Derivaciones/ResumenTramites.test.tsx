import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResumenTramites } from '@/components/features/derivaciones/ResumenTramites';
import type { TramiteResumenDerivacion } from '@/types/derivaciones';

const tramites: TramiteResumenDerivacion[] = [
    {
        id: 1,
        numero_completo: 'DLA-0007/2026',
        fecha: '10/06/2026 08:00',
        descripcion: 'Solicitud de licencia',
        area: 'DLA · Dirección Legal',
        derivacion_numero: 3,
        derivacion_fecha: '11/06/2026 09:00',
        derivado_de: 'Juan Pérez',
    },
    {
        id: 2,
        numero_completo: 'ADM-0002/2026',
        fecha: '09/06/2026 10:00',
        descripcion: 'Informe de gestión',
        area: 'ADM · Administración',
        derivacion_numero: null,
        derivacion_fecha: null,
        derivado_de: null,
    },
];

describe('ResumenTramites', () => {
    it('no renderiza nada cuando no hay trámites', () => {
        const { container } = render(<ResumenTramites tramites={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('muestra el total y el detalle compacto de cada trámite', () => {
        render(<ResumenTramites tramites={tramites} />);

        expect(screen.getByText('2 trámites seleccionados')).toBeInTheDocument();
        expect(screen.getByText('DLA-0007/2026')).toBeInTheDocument();
        expect(screen.getByText('DLA · Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('Solicitud de licencia')).toBeInTheDocument();
        expect(screen.getByText(/Derivación N° 3/)).toBeInTheDocument();
        expect(screen.getByText(/de Juan Pérez/)).toBeInTheDocument();
        expect(screen.getByText('ADM-0002/2026')).toBeInTheDocument();
        expect(screen.getByText('Informe de gestión')).toBeInTheDocument();
    });

    it('usa el singular cuando hay un solo trámite', () => {
        render(<ResumenTramites tramites={[tramites[0]]} />);

        expect(screen.getByText('1 trámite seleccionado')).toBeInTheDocument();
    });

    it('expone la lista con etiqueta accesible', () => {
        render(<ResumenTramites tramites={tramites} />);

        expect(screen.getByRole('list', { name: 'Trámites seleccionados' })).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
});
