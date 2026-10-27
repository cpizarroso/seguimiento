import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TramiteForm } from '@/components/features/tramites/TramiteForm';
import type { SecuenciasPorArea } from '@/types/tramites';

const areas = [
    { id: 7, nombre: 'Dirección Legal', codigo: 'DLA' },
    { id: 9, nombre: 'Administración', codigo: 'ADM' },
];

const secuencias: SecuenciasPorArea = {
    '7': {
        ultimo_numero: 12,
        ultimo_completo: 'DLA-0012/2026',
        siguiente: 13,
        numero_completo: 'DLA-0013/2026',
    },
    '9': {
        ultimo_numero: 0,
        ultimo_completo: null,
        siguiente: 1,
        numero_completo: 'ADM-0001/2026',
    },
};

function crearFormulario(areaInicial: string) {
    const [data, setData] = useState({
        descripcion: '',
        numero_diamante: '',
        area_id: areaInicial,
        urgente: false,
    });

    const form: any = {
        data,
        setData: (key: string, value: unknown) => setData((prev) => ({ ...prev, [key]: value })),
        post: vi.fn(),
        put: vi.fn(),
        processing: false,
        errors: {},
    };

    return form;
}

function Harness({ areaInicial = '7', numeroAsignado }: { areaInicial?: string; numeroAsignado?: string }) {
    const form = crearFormulario(areaInicial);

    return (
        <TramiteForm
            form={form}
            areas={areas}
            submitUrl="/tramites"
            secuencias={secuencias}
            numeroAsignado={numeroAsignado}
        />
    );
}

describe('TramiteForm número de trámite', () => {
    it('muestra el próximo número, el último emitido y la aclaración', () => {
        render(<Harness />);

        expect(screen.getByText('Próximo N° de trámite')).toBeInTheDocument();
        expect(screen.getByText('DLA-0013/2026')).toBeInTheDocument();
        expect(screen.getByText('Último emitido: DLA-0012/2026')).toBeInTheDocument();
        expect(screen.getByText('El número se asigna al guardar.')).toBeInTheDocument();
    });

    it('actualiza la secuencia al cambiar de área', () => {
        render(<Harness />);

        fireEvent.change(screen.getByLabelText(/Área/), { target: { value: '9' } });

        expect(screen.getByText('ADM-0001/2026')).toBeInTheDocument();
        expect(screen.queryByText('Último emitido: DLA-0012/2026')).not.toBeInTheDocument();
    });

    it('no muestra el bloque cuando el área no tiene secuencia', () => {
        render(<Harness areaInicial="99" />);

        expect(screen.queryByText('Próximo N° de trámite')).not.toBeInTheDocument();
    });

    it('muestra el número asignado en modo edición', () => {
        render(<Harness areaInicial="7" numeroAsignado="DLA-0007/2026" />);

        expect(screen.getByText('N° de trámite')).toBeInTheDocument();
        expect(screen.getByText('DLA-0007/2026')).toBeInTheDocument();
        expect(screen.getByText('Número asignado a este trámite.')).toBeInTheDocument();
        expect(screen.queryByText('Próximo N° de trámite')).not.toBeInTheDocument();
    });
});
