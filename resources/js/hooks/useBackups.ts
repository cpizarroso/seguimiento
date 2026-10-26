import { useState } from 'react';
import { backupService } from '@/services/backupService';
import type { Backup, EventoBackup, PuedeBackups } from '@/types/backups';

export function useBackups(puede: PuedeBackups) {
    const [backupARestaurar, setBackupARestaurar] = useState<Backup | null>(null);
    const [backupAEliminar, setBackupAEliminar] = useState<Backup | null>(null);
    const [backupHistorial, setBackupHistorial] = useState<Backup | null>(null);
    const [modalArchivo, setModalArchivo] = useState(false);
    const [creando, setCreando] = useState(false);
    const [eventos, setEventos] = useState<EventoBackup[]>([]);
    const [cargandoEventos, setCargandoEventos] = useState(false);
    const [errorEventos, setErrorEventos] = useState<string | null>(null);

    const crear = () => {
        if (!puede.crear || creando) return;

        setCreando(true);
        backupService.crear({ onFinish: () => setCreando(false) });
    };

    const descargar = (backup: Backup) => {
        if (!puede.descargar || !backup.archivo_existe) return;

        backupService.descargar(backup.id);
    };

    const alternarProteccion = (backup: Backup) => {
        if (!puede.editar) return;

        backupService.proteger(backup.id, !backup.protegido);
    };

    const abrirEliminar = (backup: Backup) => {
        if (!puede.eliminar) return;

        setBackupAEliminar(backup);
    };

    const confirmarEliminar = (backup: Backup) => {
        backupService.eliminar(backup.id, {
            onSuccess: () => setBackupAEliminar(null),
        });
    };

    const abrirRestaurar = (backup: Backup) => {
        if (!puede.restaurar) return;

        setBackupARestaurar(backup);
    };

    const abrirArchivo = () => {
        if (!puede.restaurar) return;

        setModalArchivo(true);
    };

    const abrirHistorial = async (backup: Backup) => {
        setBackupHistorial(backup);
        setEventos([]);
        setErrorEventos(null);
        setCargandoEventos(true);

        try {
            const respuesta = await backupService.eventos(backup.id);
            setEventos(respuesta.data as unknown as EventoBackup[]);
        } catch {
            setErrorEventos('No se pudo cargar el historial del backup.');
        } finally {
            setCargandoEventos(false);
        }
    };

    const cerrarHistorial = () => setBackupHistorial(null);

    return {
        puede,
        creando,
        backupARestaurar,
        backupAEliminar,
        backupHistorial,
        modalArchivo,
        eventos,
        cargandoEventos,
        errorEventos,
        crear,
        descargar,
        alternarProteccion,
        abrirEliminar,
        cerrarEliminar: () => setBackupAEliminar(null),
        confirmarEliminar,
        abrirRestaurar,
        cerrarRestaurar: () => setBackupARestaurar(null),
        abrirArchivo,
        cerrarArchivo: () => setModalArchivo(false),
        abrirHistorial,
        cerrarHistorial,
        actualizarEspacio: () => backupService.actualizarEspacio(),
    };
}
