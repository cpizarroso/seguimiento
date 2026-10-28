<?php

namespace App\Support;

use PDOException;
use Throwable;

/**
 * Distingue los fallos de conexión a la base de datos del resto de errores.
 *
 * Sirve para mostrar una página amable al cliente cuando el servicio no está
 * disponible (base inexistente, credenciales inválidas, servidor caído) en
 * lugar de la página de error genérica.
 */
final class FalloBaseDatos
{
    /**
     * Códigos de error de MySQL que indican que no se pudo establecer la
     * conexión o que la base de datos configurada no existe.
     *
     * @var list<string>
     */
    private const CODIGOS = [
        '1044', // Acceso denegado a la base de datos
        '1045', // Acceso denegado para el usuario
        '1049', // Base de datos desconocida
        '1130', // Host no permitido
        '2002', // No se puede conectar al servidor
        '2003', // No se puede conectar al servidor (red)
        '2005', // Host desconocido
        '2006', // El servidor se ha ido
    ];

    public static function esConexion(Throwable $e): bool
    {
        if (! $e instanceof PDOException) {
            return false;
        }

        $mensaje = $e->getMessage();

        if (str_contains($mensaje, 'could not find driver')) {
            return true;
        }

        if (preg_match('/\[(\d{4})\]/', $mensaje, $coincidencia) === 1) {
            return in_array($coincidencia[1], self::CODIGOS, true);
        }

        return false;
    }
}
