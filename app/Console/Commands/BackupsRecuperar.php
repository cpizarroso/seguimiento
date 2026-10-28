<?php

namespace App\Console\Commands;

use App\Backups\DiscosBackups;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Services\BackupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

class BackupsRecuperar extends Command
{
    protected $signature = 'backups:recuperar {--limpiar : Elimina archivos huérfanos del disco de backups}';

    protected $description = 'Levanta la aplicación, verifica la conexión y marca como fallidos los backups interrumpidos';

    public function handle(BackupService $backups, DiscosBackups $discos): int
    {
        $this->levantarAplicacion();

        if (! $this->verificarConexion()) {
            return self::FAILURE;
        }

        $this->mostrarUltimoPreRestauracion();
        $this->mostrarUltimoEvento();

        $interrumpidos = Backup::where('estado', Backup::ESTADO_EN_PROCESO)
            ->where('updated_at', '<', now()->subHour())
            ->get();

        foreach ($interrumpidos as $backup) {
            $backup->update([
                'estado' => Backup::ESTADO_FALLIDO,
                'error' => 'Ejecución interrumpida: el proceso terminó sin finalizar el backup.',
            ]);

            $backups->registrarEvento(
                $backup,
                BackupEvento::ACCION_FALLO,
                null,
                null,
                'recuperación: proceso interrumpido',
            );
        }

        $this->info("Backups marcados como fallidos: {$interrumpidos->count()}");

        if ($this->option('limpiar')) {
            $this->limpiarHuerfanos($backups, $discos);
        }

        return self::SUCCESS;
    }

    private function levantarAplicacion(): void
    {
        try {
            if (app()->isDownForMaintenance()) {
                Artisan::call('up');
                $this->info('Modo mantenimiento desactivado.');
            } else {
                $this->line('La aplicación no está en mantenimiento.');
            }
        } catch (Throwable $e) {
            $this->warn('No se pudo verificar el modo mantenimiento: '.$e->getMessage());
        }
    }

    private function verificarConexion(): bool
    {
        try {
            $pdo = DB::connection()->getPdo();
            $pdo->query('SELECT 1');
            $version = (string) $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);

            $this->info('Conexión a la base de datos: OK ('.$version.')');

            return true;
        } catch (Throwable $e) {
            $this->error('Conexión a la base de datos: FALLÓ — '.$e->getMessage());

            return false;
        }
    }

    private function mostrarUltimoPreRestauracion(): void
    {
        $pre = Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)
            ->where('estado', Backup::ESTADO_COMPLETADO)
            ->latest('created_at')
            ->first();

        if ($pre === null) {
            $this->line('Último pre-restauración: no hay copias previas registradas.');

            return;
        }

        $this->line(sprintf(
            'Último pre-restauración: %s (%s, %s) — %s',
            $pre->nombre,
            $pre->tamano_mb !== null ? $pre->tamano_mb.' MB' : 'tamaño desconocido',
            $pre->created_at?->format('d/m/Y H:i'),
            $pre->protegido ? 'protegido' : 'sin protección',
        ));
    }

    private function mostrarUltimoEvento(): void
    {
        $evento = BackupEvento::latest('id')->first();

        if ($evento === null) {
            $this->line('Último evento: sin registros.');

            return;
        }

        $this->line(sprintf(
            'Último evento: %s — %s (%s)',
            $evento->accion,
            $evento->backup_nombre,
            $evento->created_at?->format('d/m/Y H:i:s') ?? 'sin fecha',
        ));
    }

    private function limpiarHuerfanos(BackupService $backups, DiscosBackups $discos): void
    {
        $disco = $discos->disco();
        $registrados = Backup::pluck('nombre')->all();
        $eliminados = 0;

        foreach ($disco->files('') as $archivo) {
            if (in_array(basename($archivo), $registrados, true)) {
                continue;
            }

            $disco->delete($archivo);
            $eliminados++;
        }

        $backups->invalidarEspacio();

        $this->info("Archivos huérfanos eliminados: {$eliminados}");
    }
}
