import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PermisosUsuario } from '@/components/features/users/PermisosUsuario';
import type { PermisoCatalogo, PermisoOverride } from '@/components/features/users/UserForm';

const catalogo: PermisoCatalogo[] = [
    { id: 1, modulo: 'tramites', modulo_nombre: 'Trámites', accion: 'consulta', accion_nombre: 'Consulta' },
    { id: 2, modulo: 'tramites', modulo_nombre: 'Trámites', accion: 'tramitacion', accion_nombre: 'Tramitación' },
    { id: 3, modulo: 'usuarios', modulo_nombre: 'Usuarios', accion: 'edicion', accion_nombre: 'Edición' },
];

function Harness({
    inicial = [],
    rol = new Set<number>(),
    error,
}: {
    inicial?: PermisoOverride[];
    rol?: Set<number>;
    error?: string;
}) {
    const [seleccionados, setSeleccionados] = useState<PermisoOverride[]>(inicial);

    return (
        <PermisosUsuario
            catalogo={catalogo}
            seleccionados={seleccionados}
            permisosDelRol={rol}
            error={error}
            onChange={(permisoId, estado) => {
                setSeleccionados((previos) => {
                    const restantes = previos.filter((permiso) => permiso.permiso_id !== permisoId);

                    if (estado === 'heredar') {
                        return restantes;
                    }

                    return [...restantes, { permiso_id: permisoId, permitido: estado === 'permitir' }];
                });
            }}
        />
    );
}

function grupo(nombre: string) {
    return screen.getByRole('group', { name: `Permiso ${nombre}` });
}

function fila(nombre: string) {
    return grupo(nombre).closest('li') as HTMLElement;
}

describe('PermisosUsuario', () => {
    it('agrupa el catálogo por módulo y muestra la pista del rol', () => {
        render(<Harness rol={new Set([1])} />);

        expect(screen.getByText('Trámites')).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Consulta')).toBeInTheDocument();
        expect(screen.getByText('Tramitación')).toBeInTheDocument();

        expect(within(fila('tramites.consulta')).getByText('El rol lo permite')).toBeInTheDocument();
        expect(within(fila('tramites.tramitacion')).getByText('El rol no lo permite')).toBeInTheDocument();
    });

    it('inicia en Heredar y permite cambiar a Permitir y Denegar', () => {
        render(<Harness />);

        const botones = grupo('tramites.tramitacion');

        expect(within(botones).getByRole('button', { name: 'Heredar' })).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(within(botones).getByRole('button', { name: 'Permitir' }));

        expect(within(botones).getByRole('button', { name: 'Permitir' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(botones).getByRole('button', { name: 'Heredar' })).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(within(botones).getByRole('button', { name: 'Denegar' }));

        expect(within(botones).getByRole('button', { name: 'Denegar' })).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(within(botones).getByRole('button', { name: 'Heredar' }));

        expect(within(botones).getByRole('button', { name: 'Heredar' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('refleja los overrides existentes', () => {
        render(<Harness inicial={[{ permiso_id: 2, permitido: false }]} />);

        expect(within(grupo('tramites.tramitacion')).getByRole('button', { name: 'Denegar' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('filtra el catálogo por búsqueda', () => {
        render(<Harness />);

        fireEvent.change(screen.getByPlaceholderText('Buscar permiso...'), { target: { value: 'usuarios' } });

        expect(screen.queryByText('Trámites')).not.toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
    });

    it('muestra el mensaje de error', () => {
        render(<Harness error="No puedes quitarte ese permiso." />);

        expect(screen.getByText('No puedes quitarte ese permiso.')).toBeInTheDocument();
    });
});
