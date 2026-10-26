<?php

namespace App\Backups;

use App\Backups\Contrato\Dumper;
use App\Support\BinarioMysql;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Implementación real basada en los binarios de MySQL (mysqldump / mysql).
 *
 * Se generan dos volcados y se concatenan: estructura de todas las tablas y
 * datos solo de las tablas de negocio (ver logica-backup.md §10).
 */
class CliMySqlDumper implements Dumper
{
    public function __construct(private readonly BinarioMysql $binarios) {}

    public function disponible(): bool
    {
        return $this->binarios->mysqldump() !== null && $this->binarios->mysql() !== null;
    }

    public function volcar(string $rutaSql, string $tipo): void
    {
        $mysqldump = $this->binarios->mysqldump();

        if ($mysqldump === null) {
            throw new RuntimeException(
                'No se encontró mysqldump. Configure BACKUP_MYSQLDUMP_PATH en el archivo .env.'
            );
        }

        $cnf = $this->crearCnf();
        $estructura = $this->temporal('estructura');
        $datos = null;

        try {
            $this->ejecutarDump($mysqldump, $cnf, true, [], $estructura);

            $tablas = $this->tablasConDatos();

            if ($tablas !== []) {
                $datos = $this->temporal('datos');
                $this->ejecutarDump($mysqldump, $cnf, false, $tablas, $datos);
            }

            $this->componer($rutaSql, $estructura, $datos, $tipo);
        } finally {
            $this->eliminar([$cnf, $estructura, $datos]);
        }
    }

    public function restaurar(string $rutaSql): void
    {
        $mysql = $this->binarios->mysql();

        if ($mysql === null) {
            throw new RuntimeException(
                'No se encontró mysql. Configure BACKUP_MYSQL_PATH en el archivo .env.'
            );
        }

        $cnf = $this->crearCnf();
        $entrada = fopen($rutaSql, 'rb');

        if ($entrada === false) {
            @unlink($cnf);

            throw new RuntimeException("No se pudo leer el archivo SQL: {$rutaSql}");
        }

        try {
            $proceso = new Process([
                $mysql,
                '--defaults-extra-file='.$cnf,
                '--local-infile=0',
                '--default-character-set=utf8mb4',
                $this->baseDatos(),
            ]);

            $proceso->setTimeout((float) config('backups.timeout', 3600));
            $proceso->setInput($entrada);
            $proceso->run();

            if (! $proceso->isSuccessful()) {
                throw new RuntimeException(
                    'La importación falló: '.trim($proceso->getErrorOutput() ?: $proceso->getOutput())
                );
            }
        } finally {
            fclose($entrada);
            @unlink($cnf);
        }
    }

    public function vaciarEsquema(): void
    {
        $mysql = $this->binarios->mysql();

        if ($mysql === null) {
            throw new RuntimeException(
                'No se encontró mysql. Configure BACKUP_MYSQL_PATH en el archivo .env.'
            );
        }

        $tablas = $this->tablasExistentes();

        if ($tablas === []) {
            return;
        }

        $sentencias = array_map(
            fn (string $tabla): string => 'DROP TABLE IF EXISTS `'.str_replace('`', '``', $tabla).'`;',
            $tablas,
        );

        $sql = 'SET FOREIGN_KEY_CHECKS=0; '.implode(' ', $sentencias).' SET FOREIGN_KEY_CHECKS=1;';

        $cnf = $this->crearCnf();

        try {
            $proceso = new Process([
                $mysql,
                '--defaults-extra-file='.$cnf,
                $this->baseDatos(),
                '-e',
                $sql,
            ]);

            $proceso->setTimeout((float) config('backups.timeout', 3600));
            $proceso->run();

            if (! $proceso->isSuccessful()) {
                throw new RuntimeException(
                    'No se pudo vaciar el esquema: '.trim($proceso->getErrorOutput() ?: $proceso->getOutput())
                );
            }
        } finally {
            @unlink($cnf);
        }
    }

    /**
     * @param  list<string>  $tablas
     */
    private function ejecutarDump(
        string $binario,
        string $cnf,
        bool $soloEstructura,
        array $tablas,
        string $destino,
    ): void {
        $comando = $this->comandoDump($binario, $cnf, $soloEstructura, $tablas);

        try {
            $this->ejecutarHaciaArchivo($comando, $destino);
        } catch (RuntimeException $e) {
            // MariaDB no reconoce --set-gtid-purged: se reintenta sin esa opción.
            if (! str_contains(strtolower($e->getMessage()), 'gtid')) {
                throw $e;
            }

            $comando = array_values(array_filter(
                $comando,
                fn (string $argumento): bool => ! str_starts_with($argumento, '--set-gtid-purged'),
            ));

            $this->ejecutarHaciaArchivo($comando, $destino);
        }
    }

    /**
     * @param  list<string>  $tablas
     * @return list<string>
     */
    private function comandoDump(string $binario, string $cnf, bool $soloEstructura, array $tablas): array
    {
        $opciones = [
            '--defaults-extra-file='.$cnf,
            $soloEstructura ? '--no-data' : '--no-create-info',
            '--lock-tables',
            '--no-tablespaces',
            '--skip-comments',
            '--no-create-db',
            '--default-character-set=utf8mb4',
            '--set-gtid-purged=OFF',
        ];

        if ($soloEstructura) {
            $opciones[] = '--routines';
            $opciones[] = '--triggers';
            $opciones[] = '--events';
        } else {
            $opciones[] = '--complete-insert';
        }

        return [$binario, ...$opciones, $this->baseDatos(), ...$tablas];
    }

    /**
     * @param  list<string>  $comando
     */
    private function ejecutarHaciaArchivo(array $comando, string $destino): void
    {
        $salida = fopen($destino, 'wb');

        if ($salida === false) {
            throw new RuntimeException("No se pudo escribir el volcado temporal: {$destino}");
        }

        $error = '';

        try {
            $proceso = new Process($comando);
            $proceso->setTimeout((float) config('backups.timeout', 3600));
            $proceso->run(function (string $tipo, string $buffer) use ($salida, &$error): void {
                if ($tipo === Process::ERR) {
                    $error .= $buffer;

                    return;
                }

                fwrite($salida, $buffer);
            });

            if (! $proceso->isSuccessful()) {
                throw new RuntimeException(
                    'mysqldump falló: '.trim($error !== '' ? $error : $proceso->getErrorOutput())
                );
            }
        } finally {
            fclose($salida);
        }
    }

    private function componer(string $rutaSql, string $estructura, ?string $datos, string $tipo): void
    {
        $salida = fopen($rutaSql, 'wb');

        if ($salida === false) {
            throw new RuntimeException("No se pudo escribir el backup: {$rutaSql}");
        }

        try {
            fwrite($salida, $this->cabecera($tipo));

            foreach ([$estructura, $datos] as $archivo) {
                if ($archivo === null) {
                    continue;
                }

                $entrada = fopen($archivo, 'rb');

                if ($entrada !== false) {
                    stream_copy_to_stream($entrada, $salida);
                    fclose($entrada);
                    fwrite($salida, "\n");
                }
            }

            fwrite($salida, $this->pie());
        } finally {
            fclose($salida);
        }
    }

    private function cabecera(string $tipo): string
    {
        $fecha = now()->format('Y-m-d H:i:s');
        $base = $this->baseDatos();
        $zona = config('app.timezone');

        return <<<SQL
-- ============================================================
-- Backup: Seguimiento de Trámites
-- Base: {$base}
-- Generado: {$fecha} ({$zona})
-- Tipo: {$tipo}
-- ============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET UNIQUE_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

SQL;
    }

    private function pie(): string
    {
        return <<<'SQL'

SET UNIQUE_CHECKS=1;
SET FOREIGN_KEY_CHECKS=1;
-- ====================== FIN DEL BACKUP ======================
SQL;
    }

    /**
     * @return list<string>
     */
    private function tablasConDatos(): array
    {
        $sinDatos = (array) config('backups.tablas_sin_datos', []);

        return array_values(array_filter(
            $this->tablasExistentes(),
            fn (string $tabla): bool => ! in_array($tabla, $sinDatos, true),
        ));
    }

    /**
     * @return list<string>
     */
    private function tablasExistentes(): array
    {
        $filas = DB::select(
            "SELECT table_name AS nombre
               FROM information_schema.tables
              WHERE table_schema = DATABASE()
                AND table_type = 'BASE TABLE'"
        );

        $tablas = array_map(fn (object $fila): string => (string) $fila->nombre, $filas);
        sort($tablas);

        return $tablas;
    }

    private function crearCnf(): string
    {
        $conexion = (array) config('database.connections.mysql');
        $directorio = storage_path('framework/tmp');

        if (! is_dir($directorio)) {
            mkdir($directorio, 0700, true);
        }

        $archivo = tempnam($directorio, 'my-');

        if ($archivo === false) {
            throw new RuntimeException('No se pudo crear el archivo temporal de credenciales.');
        }

        $contenido = "[client]\n"
            .'host='.($conexion['host'] ?? '127.0.0.1')."\n"
            .'port='.($conexion['port'] ?? '3306')."\n"
            .'user='.($conexion['username'] ?? 'root')."\n"
            .'password="'.addcslashes((string) ($conexion['password'] ?? ''), "\"\\")."\"\n"
            ."default-character-set=utf8mb4\n";

        file_put_contents($archivo, $contenido);
        @chmod($archivo, 0600);

        return $archivo;
    }

    private function temporal(string $prefijo): string
    {
        $directorio = storage_path('framework/tmp');

        if (! is_dir($directorio)) {
            mkdir($directorio, 0700, true);
        }

        $archivo = tempnam($directorio, $prefijo.'-');

        if ($archivo === false) {
            throw new RuntimeException('No se pudo crear un archivo temporal para el volcado.');
        }

        return $archivo;
    }

    private function baseDatos(): string
    {
        return (string) config('database.connections.mysql.database');
    }

    /**
     * @param  array<int, string|null>  $rutas
     */
    private function eliminar(array $rutas): void
    {
        foreach ($rutas as $ruta) {
            if (is_string($ruta) && is_file($ruta)) {
                @unlink($ruta);
            }
        }
    }
}
