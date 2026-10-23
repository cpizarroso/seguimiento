import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DerivarForm, type DerivarFormData } from '@/components/features/derivaciones/DerivarForm';
import { DestinoDerivacion } from '@/components/features/derivaciones/DestinoDerivacion';
import type { DestinatarioDerivacion } from '@/types/derivaciones';

const destinatarios: DestinatarioDerivacion[] = [
    {
        user_id: 10,
        name: 'Ana Pérez',
        persona: 'Ana Pérez',
        area_id: 1,
        area_codigo: 'DLA',
        area_nombre: 'Dirección Legal',
    },
    {
        user_id: 11,
        name: 'Luis Gómez',
        persona: 'Luis Gómez',
        area_id: 1,
        area_codigo: 'DLA',
        area_nombre: 'Dirección Legal',
    },
    {
        user_id: 12,
        name: 'Marta Rojas',
        persona: 'Marta Rojas',
        area_id: 2,
        area_codigo: 'ADM',
        area_nombre: 'Administración',
    },
];

function DestinoHarness() {
    const [data, setData] = useState({ area_id: '', derivado_a: '' });

    return (
        <DestinoDerivacion
            form={{
                data,
                setData: (key, value) => setData((prev) => ({ ...prev, [key]: value })),
                errors: {},
            }}
            destinatarios={destinatarios}
        />
    );
}

function FormHarness({
    onSubmit,
}: {
    onSubmit: (url: string, options?: unknown, data?: DerivarFormData) => void;
}) {
    const [data, setData] = useState<DerivarFormData>({
        area_id: '',
        derivado_a: '',
        glosa_derivacion: '',
        tramite_ids: [5],
    });

    const actualizar = (keyOrData: keyof DerivarFormData | Partial<DerivarFormData>, value?: unknown) => {
        setData((prev) => (
            typeof keyOrData === 'string'
                ? { ...prev, [keyOrData]: value }
                : { ...prev, ...keyOrData }
        ));
    };

    return (
        <DerivarForm
            form={{
                data,
                setData: actualizar,
                post: (url: string, options?: unknown) => onSubmit(url, options, data),
                processing: false,
                errors: {},
            } as never}
            destinatarios={destinatarios}
            submitUrl="/tramites/derivar-varios"
        />
    );
}

function elegirArea(areaId: string) {
    fireEvent.change(screen.getByLabelText(/Área/), { target: { value: areaId } });
}

async function elegirPersona(nombre: RegExp) {
    fireEvent.click(screen.getByRole('button', { name: 'Persona' }));

    const listbox = screen.getByRole('listbox');
    fireEvent.click(within(listbox).getByRole('button', { name: nombre }));
}

describe('DestinoDerivacion', () => {
    it('primero exige el area y luego muestra solo las personas de esa area', async () => {
        render(<DestinoHarness />);

        const persona = screen.getByRole('button', { name: 'Persona' });
        expect(persona).toBeDisabled();

        elegirArea('1');
        expect(persona).toBeEnabled();

        fireEvent.click(persona);
        const listbox = screen.getByRole('listbox');

        expect(within(listbox).getByRole('button', { name: /Ana Pérez/ })).toBeInTheDocument();
        expect(within(listbox).getByRole('button', { name: /Luis Gómez/ })).toBeInTheDocument();
        expect(within(listbox).queryByRole('button', { name: /Marta Rojas/ })).not.toBeInTheDocument();
    });

    it('selecciona una persona y la limpia al cambiar de area', async () => {
        render(<DestinoHarness />);

        elegirArea('1');
        await elegirPersona(/Ana Pérez/);

        expect(screen.getByRole('button', { name: 'Persona' })).toHaveTextContent('Ana Pérez');

        elegirArea('2');

        expect(screen.getByRole('button', { name: 'Persona' })).toHaveTextContent('Seleccione una persona');
        expect(screen.getByRole('button', { name: 'Persona' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Persona' }));
        expect(within(screen.getByRole('listbox')).getByRole('button', { name: /Marta Rojas/ })).toBeInTheDocument();
        expect(within(screen.getByRole('listbox')).queryByRole('button', { name: /Ana Pérez/ })).not.toBeInTheDocument();
    });
});

describe('DerivarForm', () => {
    it('no permite enviar sin area y persona', () => {
        render(<FormHarness onSubmit={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Derivar' })).toBeDisabled();
    });

    it('envia la derivacion al destino seleccionado', async () => {
        const onSubmit = vi.fn();
        render(<FormHarness onSubmit={onSubmit} />);

        elegirArea('1');
        await elegirPersona(/Luis Gómez/);
        fireEvent.change(screen.getByLabelText('Glosa de derivación'), {
            target: { value: 'Derivación masiva' },
        });

        const enviar = screen.getByRole('button', { name: 'Derivar' });
        expect(enviar).toBeEnabled();
        fireEvent.click(enviar);

        expect(onSubmit).toHaveBeenCalledWith(
            '/tramites/derivar-varios',
            expect.objectContaining({ preserveScroll: true }),
            expect.objectContaining({
                area_id: '1',
                derivado_a: '11',
                glosa_derivacion: 'Derivación masiva',
                tramite_ids: [5],
            }),
        );
    });
});
