<?php

namespace App\Http\Controllers\Backups;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backups\RestaurarBackupRequest;
use App\Http\Requests\Backups\RestaurarDesdeArchivoRequest;
use App\Models\Backup;
use App\Services\BackupRestauracionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class BackupRestauracionController extends Controller
{
    public function __construct(
        private readonly BackupRestauracionService $restauracion,
    ) {}

    public function restaurar(RestaurarBackupRequest $request, Backup $backup): RedirectResponse
    {
        try {
            $resultado = $this->restauracion->restaurarBackup(
                $backup,
                $request->user(),
                $request->ip(),
            );

            return to_route('backups.index')->with(
                'success',
                "Base de datos restaurada desde {$backup->nombre}. Copia previa: {$resultado['pre']->nombre}.",
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('backup.restauracion.error', [
                'backup_id' => $backup->id,
                'mensaje' => $e->getMessage(),
            ]);

            return to_route('backups.index')->with('error', $e->getMessage());
        }
    }

    public function restaurarArchivo(RestaurarDesdeArchivoRequest $request): RedirectResponse
    {
        try {
            $resultado = $this->restauracion->restaurarArchivo(
                $request->file('archivo'),
                $request->user(),
                $request->ip(),
            );

            return to_route('backups.index')->with(
                'success',
                "Archivo importado y restaurado: {$resultado['backup']->nombre}. Copia previa: {$resultado['pre']->nombre}.",
            );
        } catch (ValidationException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::error('backup.restauracion.archivo.error', ['mensaje' => $e->getMessage()]);

            return to_route('backups.index')->with('error', $e->getMessage());
        }
    }
}
