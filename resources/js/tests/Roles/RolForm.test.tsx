import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RolForm, type RolFormController } from '@/components/features/roles/RolForm';
import type { PermisosAgrupados } from '@/types/roles';

const permisosAgrupados: PermisosAgrupados = {
    Dashboard: [
        { id: 1, modulo: 'dashboard', modulo_nombre: 'Dashboard', accion: 'consulta', accion_nombre: 'Consulta' },
    ],
    Roles: [
        { id: 2, modulo: 'roles', modulo_nombre: 'Roles', accion: 'consulta', accion_nombre: 'Consulta' },
        { id: 3, modulo: 'roles', modulo_nombre: 'Roles', accion: 'edicion', accion_nombre: 'Edición' },
    ],
    Backups: [
        { id: 4, modulo: 'backups', modulo_nombre: 'Backups', accion: 'consulta', accion_nombre: 'Consulta' },
    ],
};

type Envio = RolFormController['post'];

function FormHarness(props: {
    autoSlug?: boolean;
    slugDisabled?: boolean;
    submitLabel?: string;
    method?: 'post' | 'put';
    post?: Envio;
    put?: Envio;
}) {
    const { autoSlug, slugDisabled, submitLabel, method, post = vi.fn<Envio>(), put = vi.fn<Envio>() } = props;
    const [data, setData] = useState({
        nombre: '',
        slug: '',
        descripcion: '',
        permiso_ids: [] as number[],
    });

    const form: RolFormController = {
        data,
        setData: (key, value) => {
            setData((previo) => ({ ...previo, [key]: value }));
        },
        post,
        put,
        processing: false,
        errors: {},
    };

    return (
        <RolForm
            form={form}
            permisosAgrupados={permisosAgrupados}
            submitUrl="/roles/9"
            method={method}
            submitLabel={submitLabel}
            autoSlug={autoSlug}
            slugDisabled={slugDisabled}
            onCancel={() => undefined}
        />
    );
}

describe('RolForm', () => {
    it('respeta el orden de módulos que entrega el backend', () => {
        render(<FormHarness />);

        const titulos = screen.getAllByRole('heading', { level: 4 }).map((nodo) => nodo.textContent);

        expect(titulos).toEqual(['Dashboard', 'Roles', 'Backups']);
    });

    it('propone un slug a partir del nombre en el alta', () => {
        render(<FormHarness />);

        fireEvent.change(screen.getByLabelText('Nombre del Rol'), { target: { value: 'Jefe de Área' } });

        expect(screen.getByLabelText('Slug (identificador único)')).toHaveValue('jefe_de_area');
    });

    it('no reescribe el slug al editar', () => {
        render(<FormHarness autoSlug={false} />);

        fireEvent.change(screen.getByLabelText('Nombre del Rol'), { target: { value: 'Administrador' } });

        expect(screen.getByLabelText('Slug (identificador único)')).toHaveValue('');
    });

    it('bloquea el slug de los roles del sistema', () => {
        render(<FormHarness slugDisabled />);

        expect(screen.getByLabelText('Slug (identificador único)')).toBeDisabled();
    });

    it('marca y desmarca permisos', () => {
        render(<FormHarness />);

        const permiso = screen.getByRole('checkbox', { name: 'Roles: Edición' });

        expect(permiso).not.toBeChecked();

        fireEvent.click(permiso);

        expect(permiso).toBeChecked();

        fireEvent.click(permiso);

        expect(permiso).not.toBeChecked();
    });

    it('envía por PUT cuando se edita un rol', () => {
        const put = vi.fn<Envio>();
        const post = vi.fn<Envio>();

        render(<FormHarness method="put" submitLabel="Actualizar" post={post} put={put} />);

        fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

        expect(put).toHaveBeenCalledWith('/roles/9', undefined);
        expect(post).not.toHaveBeenCalled();
    });
});
