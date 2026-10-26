<?php

namespace App\Console\Commands;

use App\Models\Backup;
use App\Models\BackupEvento;
use App\Services\BackupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupsRecuperar extends Command
{
    protected $signature = 'backups:recuperar {--limpiar : Elimina archivos huérfanos del disco de backups}';

    protected $description = 'Marca como fallidos los backups interrumpidos y limpia archivos huérfanos';

    public function handle(BackupService $backups): int
    {
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
            $this->limpiarHuerfanos($backups);
        }

        return self::SUCCESS;
    }

    private function limpiarHuerfanos(BackupService $backups): void
    {
        $disco = Storage::disk((string) config('backups.disk'));
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
