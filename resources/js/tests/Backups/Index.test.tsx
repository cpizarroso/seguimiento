import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Automatizacion, Backup, BackupsIndexProps, EspacioBackups, PuedeBackups } from '@/types/backups';

const { routerPost, routerPut, routerDelete, routerReload, formPost, formPut } = vi.hoisted(() => ({
    routerPost: vi.fn(),
    routerPut: vi.fn(),
    routerDelete: vi.fn(),
    routerReload: vi.fn(),
    formPost: vi.fn(),
    formPut: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({
    Head: () => null,
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
            post: formPost,
            put: formPut,
            processing: false,
            errors: {},
            reset: vi.fn(),
            transform: vi.fn(),
        };
    },
    router: {
        post: routerPost,
        put: routerPut,
        delete: routerDelete,
        get: vi.fn(),
        reload: routerReload,
    },
}));

vi.mock('@/components/features/backups/EstadoAlmacenamiento', () => ({
    EstadoAlmacenamiento: () => React.createElement('div', { 'data-testid': 'estado-almacenamiento' }),
}));

import BackupsIndex from '@/pages/Backups/Index';

const backup: Backup = {
    id: 1,
    nombre: 'backup-seguimiento-adm-20261026-020000-manual.sql.gz',
    nombre_original: null,
    tipo: 'manual',
    estado: 'completado',
    protegido: false,
    tamano_bytes: 1153433,
    tamano_mb: 1.1,
    hash_sha256: 'a'.repeat(64),
    error: null,
    autor: 'Admin',
    autor_id: 1,
    creado_en: '26/10/2026 02:00',
    creado_iso: '2026-10-26T02:00:00-04:00',
    url_descarga: '/backups/1/descargar',
    archivo_existe: true,
};

const espacio: EspacioBackups = {
    disco: {
        disponible: true,
        ruta: 'storage/app/private/backups-seguimiento-adm',
        total_bytes: 1_000_000,
        usado_bytes: 600_000,
        libre_bytes: 400_000,
        porcentaje_usado: 60,
    },
    backups: {
        cantidad: 1,
        total_bytes: 1153433,
        cuota_bytes: 0,
        porcentaje_cuota: null,
        huerfanos: 0,
        archivos_huerfanos: [],
        maximo: 10,
    },
    archivos: [],
    proyeccion: { backups_hasta_cuota: null, tendencia_mb_por_backup: 1.1 },
    alertas: [],
    estado: 'normal',
};

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
    ultima_ejecucion: '26/10/2026 02:00',
    proxima_ejecucion: '27/10/2026 02:00',
    habilitado_en: '25/10/2026 10:00',
};

const todosLosPermisos: PuedeBackups = {
    crear: true,
    editar: true,
    eliminar: true,
    descargar: true,
    restaurar: true,
};

function props(puede: PuedeBackups = todosLosPermisos): BackupsIndexProps {
    return {
        backups: { data: [backup] },
        espacio,
        automatizacion,
        historial: [],
        puede,
        limite_importacion_mb: 100,
        destinos: [],
        destino_actual: null,
        ruta_predeterminada: 'storage/app/private/backups-seguimiento-dev',
    };
}

describe('Backups', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('muestra los backups y genera uno nuevo', () => {
        render(React.createElement(BackupsIndex, props()));

        expect(screen.getByText(backup.nombre)).toBeInTheDocument();
        expect(screen.getByTestId('estado-almacenamiento')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Generar backup' }));

        expect(routerPost).toHaveBeenCalledWith('/backups', {}, expect.objectContaining({ preserveScroll: true }));
    });

    it('deshabilita las acciones sin permisos', () => {
        render(
            React.createElement(
                BackupsIndex,
                props({ crear: false, editar: false, eliminar: false, descargar: false, restaurar: false }),
            ),
        );

        expect(screen.getByRole('button', { name: 'Generar backup' })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Automatización/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Restaurar' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Descargar' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
    });

    it('exige RESTAURAR y contraseña antes de restaurar', () => {
        render(React.createElement(BackupsIndex, props()));

        fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));

        expect(screen.getByText('Se perderán todos los datos actuales')).toBeInTheDocument();

        const confirmar = screen.getByRole('button', { name: 'Restaurar base de datos' });
        expect(confirmar).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Escriba RESTAURAR para confirmar'), {
            target: { value: 'RESTAURAR' },
        });
        expect(confirmar).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Contraseña de su usuario'), {
            target: { value: 'secreto' },
        });
        expect(confirmar).not.toBeDisabled();

        fireEvent.click(confirmar);

        expect(formPost).toHaveBeenCalledWith('/backups/1/restaurar', expect.any(Object));
    });

    it('muestra y guarda la automatización', () => {
        render(React.createElement(BackupsIndex, props()));

        fireEvent.click(screen.getByRole('button', { name: /Automatización/ }));

        expect(screen.getByLabelText('Hora de ejecución')).toHaveValue('02:00');
        expect(screen.getByLabelText('Máximo de backups')).toHaveValue(10);
        expect(screen.getByRole('radio', { name: /Diaria/ })).toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

        expect(formPut).toHaveBeenCalledWith('/backups/automatizacion', expect.objectContaining({ preserveScroll: true }));
    });
});
