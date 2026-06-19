import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FuncionariosIndex from '@/pages/Funcionarios/Index';

vi.mock('@/components/ui/Badge', () => ({
    Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) =>
        React.createElement('span', { 'data-variant': variant }, children),
}));

vi.mock('@/components/ui/Card', () => ({
    Card: ({ children, padding }: { children: React.ReactNode; padding?: string }) =>
        React.createElement('div', { 'data-padding': padding }, children),
}));

vi.mock('@/components/ui/Input', () => ({
    Input: ({ label, value, onChange, placeholder }: any) =>
        React.createElement('div', null,
            label && React.createElement('label', null, label),
            React.createElement('input', {
                value,
                onChange,
                placeholder,
                'aria-label': label,
            })
        ),
}));

vi.mock('@/components/ui/Select', () => ({
    Select: ({ label, options, value, onChange }: any) =>
        React.createElement('div', null,
            label && React.createElement('label', null, label),
            React.createElement('select', { value, onChange, 'aria-label': label },
                options.map((o: any) =>
                    React.createElement('option', { key: o.value, value: o.value }, o.label)
                )
            )
        ),
}));

vi.mock('@/components/ui/Button', () => ({
    Button: ({ children, onClick, variant, size, loading }: any) =>
        React.createElement('button', { onClick, 'data-variant': variant, 'data-size': size, disabled: loading }, children),
}));

vi.mock('@/components/ui/Table', () => ({
    Table: ({ columns, data, emptyMessage }: any) =>
        React.createElement('div', null,
            data.length === 0
                ? React.createElement('p', null, emptyMessage)
                : React.createElement('table', null,
                    React.createElement('thead', null,
                        React.createElement('tr', null,
                            columns.map((col: any) =>
                                React.createElement('th', { key: col.key }, col.header)
                            )
                        )
                    ),
                    React.createElement('tbody', null,
                        data.map((row: any, i: number) =>
                            React.createElement('tr', { key: row.id ?? i },
                                columns.map((col: any) =>
                                    React.createElement('td', { key: col.key },
                                        col.render ? col.render(row) : row[col.key]
                                    )
                                )
                            )
                        )
                    )
                )
        ),
}));

vi.mock('@/components/ui/Pagination', () => ({
    Pagination: ({ currentPage, lastPage, onPageChange }: any) =>
        currentPage && lastPage
            ? React.createElement('div', null, `Página ${currentPage} de ${lastPage}`)
            : null,
}));

vi.mock('@/components/ui/Modal', () => ({
    Modal: ({ open, children, title }: any) =>
        open ? React.createElement('div', { 'data-testid': 'modal' },
            React.createElement('h3', null, title),
            children
        ) : null,
}));

describe('Funcionarios Index', () => {
    const mockFuncionarios = {
        data: [
            {
                id: 1,
                nombre: 'Juan',
                apellidos: 'Pérez',
                email: 'jperez@ejemplo.gob.bo',
                cedula_identidad: '1234567',
                tipo_funcionario: 'contrato',
                estado: 'activo',
                area: { id: 1, nombre: 'Administración' },
            },
            {
                id: 2,
                nombre: 'María',
                apellidos: 'Luna',
                email: 'mluna@ejemplo.gob.bo',
                cedula_identidad: '7654321',
                tipo_funcionario: 'item',
                estado: 'inactivo',
                area: { id: 2, nombre: 'Legal' },
            },
        ],
        meta: {
            current_page: 1,
            last_page: 1,
            total: 2,
        },
    };

    it('renderiza el título y el total', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        expect(screen.getByText('Funcionarios')).toBeInTheDocument();
        expect(screen.getByText(/Total:/)).toBeInTheDocument();
    });

    it('renderiza los funcionarios en la tabla', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        expect(screen.getByText(/Juan/)).toBeInTheDocument();
        expect(screen.getByText(/María/)).toBeInTheDocument();
    });

    it('renderiza el input de búsqueda', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        expect(screen.getByPlaceholderText(/Buscar por nombre/)).toBeInTheDocument();
    });

    it('renderiza el filtro de estado', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('muestra modal de confirmación al hacer clic en Eliminar', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        const deleteButtons = screen.getAllByText('Eliminar');
        fireEvent.click(deleteButtons[0]);
        expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('muestra el badge de estado activo', () => {
        render(React.createElement(FuncionariosIndex, { funcionarios: mockFuncionarios }));
        const badges = screen.getAllByText('activo');
        expect(badges.length).toBeGreaterThan(0);
    });
});
