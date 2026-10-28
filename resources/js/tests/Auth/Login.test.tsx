import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SistemaInfo } from '@/types/sistema';

const { estado } = vi.hoisted(() => ({
    estado: { sistema: null as SistemaInfo | null },
}));

vi.mock('@inertiajs/react', () => ({
    useForm: () => ({
        data: { login: '', password: '' },
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
        errors: {},
    }),
    usePage: () => ({ props: { sistema: estado.sistema } }),
}));

import Login from '@/pages/Auth/Login';

describe('Login', () => {
    beforeEach(() => {
        estado.sistema = null;
    });

    it('muestra el badge del modo de ejecución', () => {
        estado.sistema = {
            modo: 'dev',
            entorno: 'local',
            etiqueta: 'Desarrollo',
            variante: 'info',
            nota: null,
        };

        render(React.createElement(Login));

        expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
        expect(screen.getByText('Desarrollo')).toBeInTheDocument();
    });

    it('muestra la nota de capacitación en el login', () => {
        estado.sistema = {
            modo: 'capacitacion',
            entorno: 'production',
            etiqueta: 'Capacitación',
            variante: 'warning',
            nota: 'Datos de prueba para el curso de mayo',
        };

        render(React.createElement(Login));

        expect(screen.getByText('Capacitación')).toBeInTheDocument();
        expect(screen.getByText('Datos de prueba para el curso de mayo')).toBeInTheDocument();
    });
});
