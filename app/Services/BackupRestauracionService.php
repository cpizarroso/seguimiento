<?php

namespace App\Services;

use App\Backups\Contrato\Dumper;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Models\Configuracion;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Throwable;

/**
 * Restauración de un backup propio o de un archivo externo.
 *
 * Flujo (logica-backup.md §13.3):
 *   pre-restauración → modo mantenimiento → reemplazo total → import →
 *   verificación → rollback automático si falla → migraciones pendientes →
 *   preservación de configuración de backups → auditoría.
 */
class BackupRestauracionService
{
    private static bool $shutdownRegistrado = false;

    public function __construct(
        private readonly Dumper $dumper,
        private readonly BackupService $backups,
        private readonly BackupValidador $validador,
        private readonly BackupEspacioService $espacio,
    ) {}

    /**
     * @return array{backup: Backup, pre: Backup, duracion_ms: int, rollback: bool}
     */
    public function restaurarBackup(Backup $backup, ?User $user, ?string $ip = null): array
    {
        if ($backup->estado !== Backup::ESTADO_COMPLETADO) {
            throw new RuntimeException('El backup seleccionado no está completado.');
        }

        $sql = $this->validador->validarInterno($backup);

        return $this->ejecutar($backup, $sql, $user, $ip);
    }

    /**
     * @return array{backup: Backup, pre: Backup, duracion_ms: int, rollback: bool}
     */
    public function restaurarArchivo(UploadedFile $archivo, ?User $user, ?string $ip = null): array
    {
        $sql = $this->validador->validarSubida($archivo);
        $importado = $this->backups->archivarImportado(
            $sql,
            (string) $archivo->getClientOriginalName(),
            $user?->id,
            $ip,
        );

        return $this->ejecutar($importado, $sql, $user, $ip);
    }

    /**
     * Importa y restaura un archivo ya presente en el servidor (comando CLI).
     *
     * @return array{backup: Backup, pre: Backup, duracion_ms: int, rollback: bool}
     */
    public function restaurarArchivoDelServidor(string $ruta, ?User $user = null, ?string $ip = null): array
    {
        if (! is_file($ruta)) {
            throw new RuntimeException("No se encontró el archivo: {$ruta}");
        }

        $contenido = file_get_contents($ruta);

        if ($contenido === false || $contenido === '') {
            throw new RuntimeException('El archivo está vacío o no se pudo leer.');
        }

        $sql = $this->validador->validarContenido($contenido, basename($ruta));

        $importado = $this->backups->archivarImportado($sql, basename($ruta), $user?->id, $ip);

        return $this->ejecutar($importado, $sql, $user, $ip);
    }

    /**
     * @return array{backup: Backup, pre: Backup, duracion_ms: int, rollback: bool}
     */
    private function ejecutar(Backup $origen, string $sql, ?User $user, ?string $ip): array
    {
        $inicio = microtime(true);
        $userId = $user?->id;

        // 1. Copia de seguridad previa: red de seguridad y rollback.
        $pre = $this->backups->crearPreRestauracion($userId, $ip);

        // 2. Snapshots que deben sobrevivir al reemplazo total.
        $configPrevia = Configuracion::where('clave', 'like', 'backup_%')->pluck('valor', 'clave')->all();
        $auditoria = $this->snapshotAuditoria();

        $temporal = $this->temporal();
        file_put_contents($temporal, $sql);

        try {
            $this->modoMantenimiento();

            try {
                if (config('backups.reemplazo_total', true)) {
                    $this->dumper->vaciarEsquema();
                }

                $this->dumper->restaurar($temporal);
                $this->verificarBase();
            } catch (Throwable $e) {
                $rollbackOk = $this->rollback($pre);

                Artisan::call('up');

                $this->restaurarConfiguracion($configPrevia);
                $this->reinsertarAuditoria($auditoria);
                $this->registrarFallo($pre, $origen, $userId, $ip, $e, $rollbackOk);

                throw new RuntimeException($rollbackOk
                    ? 'La restauración falló y se revirtió al estado anterior. '.$e->getMessage()
                    : 'La restauración falló y el rollback automático también falló. Revise el estado de la base. '.$e->getMessage());
            }

            try {
                Artisan::call('migrate', ['--force' => true]);
                Artisan::call('optimize:clear');
            } catch (Throwable $e) {
                Log::warning('backup.restauracion.post', [
                    'mensaje' => $e->getMessage(),
                ]);
            }

            $this->restaurarConfiguracion($configPrevia);
            $this->reinsertarAuditoria($auditoria);

            $duracion = (int) round((microtime(true) - $inicio) * 1000);

            $this->backups->registrarEvento(
                $origen,
                BackupEvento::ACCION_RESTAURACION,
                $userId,
                $ip,
                sprintf(
                    'pre=%s; duracion_ms=%d; origen=%s',
                    $pre->nombre,
                    $duracion,
                    $origen->tipo,
                ),
            );

            $this->espacio->invalidar();

            return [
                'backup' => $origen,
                'pre' => $pre->fresh() ?? $pre,
                'duracion_ms' => $duracion,
                'rollback' => false,
            ];
        } finally {
            if (is_file($temporal)) {
                @unlink($temporal);
            }

            // Garantiza salir de mantenimiento incluso con excepciones no previstas.
            try {
                Artisan::call('up');
            } catch (Throwable) {
                // Sin acción: el shutdown handler también lo intenta.
            }
        }
    }

    private function modoMantenimiento(): void
    {
        Artisan::call('down');

        if (self::$shutdownRegistrado) {
            return;
        }

        self::$shutdownRegistrado = true;

        register_shutdown_function(function (): void {
            try {
                Artisan::call('up');
            } catch (Throwable) {
                // Proceso terminando: no hay nada más que hacer.
            }
        });
    }

    private function verificarBase(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasTable('migrations')) {
            throw new RuntimeException('La base restaurada no contiene las tablas mínimas esperadas.');
        }
    }

    private function rollback(Backup $pre): bool
    {
        try {
            $sql = $this->validador->validarInterno($pre->fresh() ?? $pre);
        } catch (Throwable $e) {
            Log::error('backup.rollback.validacion', ['mensaje' => $e->getMessage()]);

            return false;
        }

        $temporal = $this->temporal();
        file_put_contents($temporal, $sql);

        try {
            if (config('backups.reemplazo_total', true)) {
                $this->dumper->vaciarEsquema();
            }

            $this->dumper->restaurar($temporal);

            return true;
        } catch (Throwable $e) {
            Log::error('backup.rollback.fallido', ['mensaje' => $e->getMessage()]);

            return false;
        } finally {
            if (is_file($temporal)) {
                @unlink($temporal);
            }
        }
    }

    /**
     * @param  array<string, string|null>  $valores
     */
    private function restaurarConfiguracion(array $valores): void
    {
        foreach ($valores as $clave => $valor) {
            Configuracion::updateOrCreate(['clave' => $clave], ['valor' => $valor]);
        }
    }

    /**
     * @return array{backups: list<array<string, mixed>>, backup_eventos: list<array<string, mixed>>}
     */
    private function snapshotAuditoria(): array
    {
        return [
            'backups' => DB::table('backups')->get()->map(fn ($fila): array => (array) $fila)->all(),
            'backup_eventos' => DB::table('backup_eventos')->get()->map(fn ($fila): array => (array) $fila)->all(),
        ];
    }

    /**
     * Reinserta la auditoría local que el reemplazo total haya eliminado.
     *
     * @param  array{backups: list<array<string, mixed>>, backup_eventos: list<array<string, mixed>>}  $auditoria
     */
    private function reinsertarAuditoria(array $auditoria): void
    {
        foreach ($auditoria as $tabla => $filas) {
            if ($filas === [] || ! Schema::hasTable($tabla)) {
                continue;
            }

            $ids = array_map(
                fn (array $fila): int => (int) $fila['id'],
                $filas,
            );

            $existentes = DB::table($tabla)->whereIn('id', $ids)->pluck('id')->all();
            $faltantes = array_values(array_filter(
                $filas,
                fn (array $fila): bool => ! in_array((int) $fila['id'], $existentes, true),
            ));

            if ($faltantes !== []) {
                DB::table($tabla)->insert($faltantes);
            }
        }
    }

    private function registrarFallo(
        Backup $pre,
        Backup $origen,
        ?int $userId,
        ?string $ip,
        Throwable $e,
        bool $rollbackOk,
    ): void {
        $this->backups->registrarEvento(
            $origen,
            BackupEvento::ACCION_FALLO,
            $userId,
            $ip,
            sprintf(
                'restauracion fallida; pre=%s; rollback=%s; error=%s',
                $pre->nombre,
                $rollbackOk ? 'ok' : 'fallido',
                $e->getMessage(),
            ),
        );
    }

    private function temporal(): string
    {
        $directorio = storage_path('framework/tmp');

        if (! is_dir($directorio)) {
            mkdir($directorio, 0700, true);
        }

        $archivo = tempnam($directorio, 'restauracion-');

        if ($archivo === false) {
            throw new RuntimeException('No se pudo crear un archivo temporal para restaurar.');
        }

        return $archivo;
    }
}
