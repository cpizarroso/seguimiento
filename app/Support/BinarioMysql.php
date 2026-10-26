<?php

namespace App\Support;

/**
 * Resuelve la ruta de los binarios de MySQL (mysqldump y mysql).
 *
 * Orden: valor explícito de configuración → PATH → rutas candidatas.
 * El resultado se cachea por proceso para no repetir búsquedas.
 */
final class BinarioMysql
{
    /** @var array<string, string|null> */
    private static array $cache = [];

    public function mysqldump(): ?string
    {
        return $this->resolver('mysqldump', config('backups.mysqldump'));
    }

    public function mysql(): ?string
    {
        return $this->resolver('mysql', config('backups.mysql'));
    }

    public function version(string $binario): ?string
    {
        $salida = @shell_exec(escapeshellarg($binario).' --version 2>&1');

        return is_string($salida) ? trim($salida) : null;
    }

    public static function limpiarCache(): void
    {
        self::$cache = [];
    }

    private function resolver(string $nombre, ?string $explicito): ?string
    {
        $clave = $nombre.'|'.($explicito ?? '');

        if (array_key_exists($clave, self::$cache)) {
            return self::$cache[$clave];
        }

        return self::$cache[$clave] = $this->buscar($nombre, $explicito);
    }

    private function buscar(string $nombre, ?string $explicito): ?string
    {
        if (is_string($explicito) && $explicito !== '') {
            return is_file($explicito) ? $explicito : null;
        }

        $binario = $nombre.(PHP_OS_FAMILY === 'Windows' ? '.exe' : '');

        $enPath = $this->buscarEnPath($binario);

        if ($enPath !== null) {
            return $enPath;
        }

        foreach ((array) config('backups.rutas_binarios', []) as $directorio) {
            $candidato = rtrim((string) $directorio, '\\/').DIRECTORY_SEPARATOR.$binario;

            if (is_file($candidato)) {
                return $candidato;
            }
        }

        return null;
    }

    private function buscarEnPath(string $binario): ?string
    {
        $comando = PHP_OS_FAMILY === 'Windows'
            ? 'where '.escapeshellarg($binario).' 2>NUL'
            : 'command -v '.escapeshellarg($binario).' 2>/dev/null';

        $salida = @shell_exec($comando);

        if (! is_string($salida)) {
            return null;
        }

        foreach (preg_split('/\R/', trim($salida)) ?: [] as $linea) {
            if ($linea !== '' && is_file($linea)) {
                return $linea;
            }
        }

        return null;
    }
}
