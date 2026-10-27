<?php

namespace App\Support;

/**
 * Entorno mínimo para ejecutar los binarios de MySQL con Symfony Process.
 *
 * En SAPI web (`cli-server`, `php-fpm`, Apache) ni `$_SERVER` ni `$_ENV`
 * exponen las variables del sistema: con `variables_order=GPCS` el arreglo
 * `$_ENV` queda vacío y `$_SERVER` solo trae datos de la petición. Symfony
 * Process arma el entorno del hijo intersectando `getenv()` con `$_SERVER`,
 * así que el proceso queda sin `SystemRoot` ni `PATH`. En Windows eso impide
 * que Winsock inicialice y `mysqldump` falla con:
 *
 *     mysqldump: Got error: 2004: Can't create TCP/IP socket (10106)
 *
 * Por CLI el filtro no aplica y todo funciona, por eso el error solo aparece
 * al generar el backup desde la pantalla (ver logica-backup.md §22.4).
 */
final class EntornoProceso
{
    /** Variables que Windows necesita para cargar DLL y proveedores de red. */
    private const CLAVES_WINDOWS = [
        'SystemRoot',
        'windir',
        'SystemDrive',
        'PATH',
        'TEMP',
        'TMP',
        'ComSpec',
        'PATHEXT',
    ];

    /**
     * Solo se completa en Windows: en el resto de sistemas el proceso hereda
     * el entorno normal y no hace falta forzar nada.
     *
     * @return array<string, string>
     */
    public static function paraBinariosMysql(): array
    {
        if (PHP_OS_FAMILY !== 'Windows') {
            return [];
        }

        $entorno = [];

        foreach (self::CLAVES_WINDOWS as $clave) {
            $valor = getenv($clave);

            if (is_string($valor) && $valor !== '') {
                $entorno[$clave] = $valor;
            }
        }

        return $entorno;
    }
}
