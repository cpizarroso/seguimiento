import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SistemaInfo } from '@/types/sistema';

const { estado } = vi.hoisted(() => ({
    estado: { sistema: null as SistemaInfo | null },
}));

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { sistema: estado.sistema } }),
}));

import { BadgeEntorno } from '@/components/features/sistema/BadgeEntorno';

describe('BadgeEntorno', () => {
    beforeEach(() => {
        estado.sistema = null;
    });

    it('muestra Desarrollo cuando el modo es dev', () => {
        estado.sistema = {
            modo: 'dev',
            entorno: 'local',
            etiqueta: 'Desarrollo',
            variante: 'warning',
            nota: null,
        };

        const { container } = render(React.createElement(BadgeEntorno));

        expect(screen.getByText('Desarrollo')).toBeInTheDocument();
        expect(screen.getByTitle('Modo: Desarrollo · APP_ENV: local')).toBeInTheDocument();
        expect(container.querySelector('.bg-excel-gold')).toBeInTheDocument();
    });

    it('muestra Producción cuando el modo es prod', () => {
        estado.sistema = {
            modo: 'prod',
            entorno: 'production',
            etiqueta: 'Producción',
            variante: 'success',
            nota: null,
        };

        const { container } = render(React.createElement(BadgeEntorno));

        expect(screen.getByText('Producción')).toBeInTheDocument();
        expect(container.querySelector('.bg-excel-green')).toBeInTheDocument();
    });

    it('muestra Capacitación e incluye la nota en el tooltip', () => {
        estado.sistema = {
            modo: 'capacitacion',
            entorno: 'production',
            etiqueta: 'Capacitación',
            variante: 'info',
            nota: 'Curso de mayo',
        };

        const { container } = render(React.createElement(BadgeEntorno));

        expect(screen.getByText('Capacitación')).toBeInTheDocument();
        expect(
            screen.getByTitle('Modo: Capacitación · APP_ENV: production · Curso de mayo'),
        ).toBeInTheDocument();
        expect(container.querySelector('.bg-excel-blue')).toBeInTheDocument();
    });

    it('no renderiza nada si la prop sistema no está disponible', () => {
        const { container } = render(React.createElement(BadgeEntorno));

        expect(container).toBeEmptyDOMElement();
    });
});
