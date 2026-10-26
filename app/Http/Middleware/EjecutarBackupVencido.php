<?php

namespace App\Http\Middleware;

use App\Services\BackupService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Disparo perezoso del backup automático.
 *
 * Cubre el caso «servidor sin cron»: nunca retrasa la respuesta (todo ocurre
 * en terminate) y compite por el mismo bloqueo que el scheduler, por lo que
 * no puede duplicar backups.
 */
class EjecutarBackupVencido
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! $request->user() || app()->isDownForMaintenance() || app()->runningUnitTests()) {
            return;
        }

        if (! Cache::lock('backups:auto-perezoso', 900)->get()) {
            return;
        }

        try {
            app(BackupService::class)->ejecutarSiVencido();
        } catch (Throwable $e) {
            Log::error('backup.perezoso.error', ['mensaje' => $e->getMessage()]);
        }
    }
}
