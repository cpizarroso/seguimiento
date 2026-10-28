import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Automatizacion, DiscoDestino } from '@/types/backups';

const { put } = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    useForm: (initial: Record<string, unknown>) => {
        const [data, setDataState] = useState<Record<string, unknown>>(initial);

        const setData = (claveOObjeto: string | Record<string, unknown>, valor?: unknown) => {
            setDataState((anterior) =>
                typeof claveOObjeto === 'string'
                    ? { ...anterior, [claveOObjeto]: valor }
                    : { ...anterior, ...claveOObjeto },
            );
        };

        return {
            data,
            setData,
            post: vi.fn(),
            put: (url: string, opciones?: Record<string, unknown>) => put(url, data, opciones),
            processing: false,
            errors: {},
            reset: vi.fn(),
            transform: vi.fn(),
        };
    },
}));

import { FormAutomatizacion } from '@/components/features/backups/FormAutomatizacion';

const automatizacion: Automatizacion = {
    habilitado: true,
    frecuencia: 'diaria',
    hora: '02:00',
    dia_semana: 1,
    dia_mes: 1,
    maximo: 10,
    cuota_mb: 0,
    alerta_porcentaje: 85,
    destino: null,
    ultima_ejecucion: null,
    proxima_ejecucion: null,
    habilitado_en: null,
};

const destinos: DiscoDestino[] = [
    {
        id: 'D',
        etiqueta: 'D:',
        ruta: 'D:\\backup-seguimiento',
        libre_bytes: 128849018880,
        total_bytes: 256060514304,
    },
    {
        id: 'E',
        etiqueta: 'E:',
        ruta: 'E:\\backup-seguimiento',
        libre_bytes: null,
        total_bytes: null,
    },
];

function renderForm(automatizacionActual: Automatizacion = automatizacion) {
    render(
        React.createElement(FormAutomatizacion, {
            automatizacion: automatizacionActual,
            destinos,
            rutaPredeterminada: 'storage/app/private/backups-seguimiento-dev',
        }),
    );
}

describe('FormAutomatizacion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lista las unidades del servidor con su espacio libre', () => {
        renderForm();

        const selector = screen.getByLabelText('Disco de destino');

        expect(selector).toHaveValue('');
        expect(screen.getByRole('option', { name: /Predeterminado del servidor/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /D: — .* libres/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /E: — espacio no disponible/ })).toBeInTheDocument();
    });

    it('envía la unidad seleccionada al guardar', () => {
        renderForm();

        fireEvent.change(screen.getByLabelText('Disco de destino'), { target: { value: 'D' } });

        expect(screen.getAllByText('D:\\backup-seguimiento').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(put).toHaveBeenCalledWith(
            '/backups/automatizacion',
            expect.objectContaining({ destino: 'D' }),
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('avisa cuando la unidad guardada ya no está disponible', () => {
        renderForm({ ...automatizacion, destino: 'F' });

        expect(screen.getByText(/ya no está disponible/)).toBeInTheDocument();
    });

    it('mantiene la ruta predeterminada cuando no se elige unidad', () => {
        renderForm();

        expect(screen.getAllByText('storage/app/private/backups-seguimiento-dev').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(put).toHaveBeenCalledWith(
            '/backups/automatizacion',
            expect.objectContaining({ destino: '' }),
            expect.any(Object),
        );
    });
});
