<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Illuminate\Console\Command;

class BackupsAuto extends Command
{
    protected $signature = 'backups:auto';

    protected $description = 'Ejecuta el backup automático si la programación está vencida';

    public function handle(BackupService $backups): int
    {
        $backup = $backups->ejecutarSiVencido();

        if ($backup === null) {
            $this->line('No hay backup automático pendiente.');

            return self::SUCCESS;
        }

        $this->info("Backup generado: {$backup->nombre}");

        return self::SUCCESS;
    }
}
