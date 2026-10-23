import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { formPut } = vi.hoisted(() => ({
    formPut: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    useForm: (initial: Record<string, string>) => ({
        data: initial,
        setData: vi.fn(),
        put: formPut,
        post: vi.fn(),
        processing: false,
        errors: {},
    }),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: () => ({ can: () => true }),
}));

import ConfiguracionIndex from '@/pages/Configuracion/Index';

const props = {
    perPage: 10,
    contadores: [],
    gestionInicial: 2023,
    gestionesConfigurables: [2026, 2025, 2024, 2023],
    puedeConfigurarReporte: true,
};

describe('Configuración', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('el administrador puede cambiar la gestión inicial del reporte', () => {
        render(React.createElement(ConfiguracionIndex, props));

        const selector = screen.getByLabelText('Gestión inicial');
        expect(selector).toHaveValue('2023');

        fireEvent.submit(selector.closest('form') as HTMLFormElement);

        expect(formPut).toHaveBeenCalledWith('/configuracion/reporte-gestion-inicial');
    });

    it('el usuario normal no ve la configuración del reporte', () => {
        render(React.createElement(ConfiguracionIndex, {
            ...props,
            puedeConfigurarReporte: false,
        }));

        expect(screen.queryByLabelText('Gestión inicial')).not.toBeInTheDocument();
    });
});
