import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Table, type Column } from '@/components/ui/Table';

interface Row {
    id: number;
    nombre: string;
    estado: string;
}

const columns: Column<Row>[] = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'estado', header: 'Estado', sortable: true },
];

const data: Row[] = [
    { id: 1, nombre: 'Alfa', estado: 'Activo' },
    { id: 2, nombre: 'Beta', estado: 'Inactivo' },
];

describe('Table', () => {
    it('muestra encabezados ordenables y reporta el click', () => {
        const onSort = vi.fn();

        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                sortBy="nombre"
                sortDirection="asc"
                onSort={onSort}
            />
        );

        const header = screen.getByRole('columnheader', { name: 'Nombre' });
        expect(header).toHaveAttribute('aria-sort', 'ascending');

        fireEvent.click(screen.getByRole('button', { name: 'Nombre' }));

        expect(onSort).toHaveBeenCalledWith('nombre');
    });

    it('marca la direccion descendente en la columna activa', () => {
        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                sortBy="estado"
                sortDirection="desc"
                onSort={vi.fn()}
            />
        );

        expect(screen.getByRole('columnheader', { name: 'Estado' })).toHaveAttribute('aria-sort', 'descending');
        expect(screen.getByRole('columnheader', { name: 'Nombre' })).not.toHaveAttribute('aria-sort');
    });

    it('no convierte en boton una columna no ordenable', () => {
        render(
            <Table
                columns={[{ key: 'nombre', header: 'Nombre' }]}
                data={data}
                keyExtractor={(row) => row.id}
                onSort={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: 'Nombre' })).not.toBeInTheDocument();
    });

    it('muestra checkboxes solo cuando la seleccion esta activa', () => {
        const { rerender } = render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
            />
        );

        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

        rerender(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                selectable
                selectedKeys={[]}
                onSelectionChange={vi.fn()}
            />
        );

        expect(screen.getByRole('checkbox', { name: 'Seleccionar todos' })).toBeInTheDocument();
        expect(screen.getAllByRole('checkbox', { name: /Seleccionar fila/ })).toHaveLength(2);
    });

    it('deshabilita las filas que no son seleccionables', () => {
        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                selectable
                selectedKeys={[]}
                onSelectionChange={vi.fn()}
                isRowSelectable={(row) => row.estado === 'Activo'}
                getRowLabel={(row) => `Seleccionar ${row.nombre}`}
            />
        );

        expect(screen.getByRole('checkbox', { name: 'Seleccionar Alfa' })).toBeEnabled();
        expect(screen.getByRole('checkbox', { name: 'Seleccionar Beta' })).toBeDisabled();
    });

    it('selecciona todos solo entre las filas elegibles', () => {
        const onSelectionChange = vi.fn();

        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                selectable
                selectedKeys={[]}
                onSelectionChange={onSelectionChange}
                isRowSelectable={(row) => row.estado === 'Activo'}
            />
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todos' }));

        expect(onSelectionChange).toHaveBeenCalledWith([1]);
    });

    it('deselecciona todos los elegibles y conserva el resto', () => {
        const onSelectionChange = vi.fn();

        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                selectable
                selectedKeys={[1, 2, 99]}
                onSelectionChange={onSelectionChange}
                isRowSelectable={(row) => row.estado === 'Activo'}
            />
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todos' }));

        expect(onSelectionChange).toHaveBeenCalledWith([2, 99]);
    });

    it('alterna la seleccion de una fila', () => {
        const onSelectionChange = vi.fn();

        render(
            <Table
                columns={columns}
                data={data}
                keyExtractor={(row) => row.id}
                selectable
                selectedKeys={[1]}
                onSelectionChange={onSelectionChange}
                getRowLabel={(row) => `Seleccionar ${row.nombre}`}
            />
        );

        fireEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar Beta' }));

        expect(onSelectionChange).toHaveBeenCalledWith([1, 2]);
    });
});
