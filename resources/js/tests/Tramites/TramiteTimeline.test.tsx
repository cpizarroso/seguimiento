import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TramiteTimeline } from '@/components/features/tramites/TramiteTimeline';

const usuario = (id: number, name: string, nombres: string, apellidos: string, puesto: string, area: string) => ({
    id,
    name,
    email: `${id}@ejemplo.gob.bo`,
    email_verified_at: null,
    created_at: '01/01/2026',
    updated_at: '01/01/2026',
    persona: {
        id,
        nombres,
        apellidos,
        nombre_completo: `${nombres} ${apellidos}`,
        ci: `CI-${id}`,
        telefono: null,
        correo: null,
        direccion: null,
        activo: true,
        puesto_activo: {
            id,
            persona_id: id,
            puesto_id: id,
            puesto: {
                id,
                nombre: puesto,
                descripcion: null,
                codigo: `PU-${id}`,
                activo: true,
                area_id: id,
            },
            fecha_inicio: '01/01/2026',
            fecha_fin: null,
            vigente: true,
        },
        area: {
            id,
            nombre: area,
            codigo: area === 'Dirección Legal' ? 'DLA' : 'ADM',
        },
        user: null,
    },
});

const derivacion = {
    id: 1,
    numero_derivacion: 2,
    derivado_de: usuario(1, 'Ana Pérez', 'Ana', 'Pérez', 'Jefa de Asesoría', 'Dirección Legal'),
    derivado_a: usuario(2, 'Luis Gómez', 'Luis', 'Gómez', 'Profesional', 'Administración'),
    fecha_derivacion: '10/06/2026 08:15',
    glosa_derivacion: 'Se deriva para revisión',
    fecha_recepcion: '10/06/2026 09:30',
    glosa_recepcion: 'Recibido conforme',
    estado: 'recepcionado',
    dias_en_derivacion: 1,
    actuaciones: [],
};

describe('TramiteTimeline', () => {
    it('muestra a quien deriva y quien recibe en columnas separadas con nombre, puesto y area', () => {
        render(<TramiteTimeline derivaciones={[derivacion] as any} />);

        expect(screen.getByRole('columnheader', { name: 'Deriva' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Recibe' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Fecha derivación' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Fecha recepción' })).toBeInTheDocument();

        expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
        expect(screen.getByText('Jefa de Asesoría · DLA - Dirección Legal')).toBeInTheDocument();
        expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
        expect(screen.getByText('Profesional · ADM - Administración')).toBeInTheDocument();

        expect(screen.getByText('10/06/2026 08:15')).toBeInTheDocument();
        expect(screen.getByText('10/06/2026 09:30')).toBeInTheDocument();
        expect(screen.getByText('Recibido conforme')).toBeInTheDocument();
    });

    it('usa el nombre del usuario cuando no tiene persona y muestra un guion sin recepcion', () => {
        const sinPersona = {
            ...derivacion,
            id: 2,
            derivado_de: { id: 3, name: 'Usuario Sin Persona' },
            derivado_a: null,
            fecha_recepcion: null,
            glosa_recepcion: null,
        };

        render(<TramiteTimeline derivaciones={[sinPersona] as any} />);

        expect(screen.getByText('Usuario Sin Persona')).toBeInTheDocument();
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    });
});
