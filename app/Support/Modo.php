<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Define los modos de ejecución de la aplicación y su base de datos asociada.
 *
 * El entorno técnico de Laravel sigue viviendo en APP_ENV; este modo es el
 * que selecciona la base de datos de negocio y el badge que ve el usuario.
 */
final class Modo
{
    public const DEV = 'dev';

    public const PROD = 'prod';

    public const CAPACITACION = 'capacitacion';

    public const BASE_DEV = 'seguimiento-dev';

    public const BASE_PROD = 'seguimiento-prod';

    public const BASE_CAP = 'seguimiento-cap';

    /**
     * @return list<string>
     */
    public static function validos(): array
    {
        return [self::DEV, self::PROD, self::CAPACITACION];
    }

    public static function valido(string $modo): bool
    {
        return in_array($modo, self::validos(), true);
    }

    public static function baseDatos(string $modo): string
    {
        return match ($modo) {
            self::DEV => self::BASE_DEV,
            self::PROD => self::BASE_PROD,
            self::CAPACITACION => self::BASE_CAP,
            default => throw new InvalidArgumentException(
                "SISTEMA_MODO inválido: «{$modo}». Valores permitidos: dev, prod, capacitacion."
            ),
        };
    }

    public static function etiqueta(string $modo): string
    {
        return match ($modo) {
            self::DEV => 'Desarrollo',
            self::PROD => 'Producción',
            self::CAPACITACION => 'Capacitación',
            default => ucfirst($modo),
        };
    }

    /**
     * @return 'default'|'success'|'warning'|'info'
     */
    public static function variante(string $modo): string
    {
        return match ($modo) {
            self::DEV => 'info',
            self::PROD => 'success',
            self::CAPACITACION => 'warning',
            default => 'default',
        };
    }
}
