<?php

namespace App\Http\Controllers\Backups;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backups\UpdateAutomatizacionRequest;
use App\Http\Resources\BackupResource;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Services\BackupEspacioService;
use App\Services\BackupProgramacionService;
use App\Services\BackupService;
use App\Services\BackupValidador;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(
        private readonly BackupService $backups,
        private readonly BackupEspacioService $espacio,
        private readonly BackupProgramacionService $programacion,
        private readonly BackupValidador $validador,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $config = $this->programacion->configuracion();

        return Inertia::render('Backups/Index', [
            'backups' => BackupResource::collection(
                Backup::with('user.persona')->latest('created_at')->latest('id')->limit(100)->get()
            ),
            'espacio' => $this->espacio->datos(),
            'automatizacion' => [
                'habilitado' => $config['habilitado'],
                'frecuencia' => $config['frecuencia'],
                'hora' => $config['hora'],
                'dia_semana' => $config['dia_semana'],
                'dia_mes' => $config['dia_mes'],
                'maximo' => $config['maximo'],
                'cuota_mb' => $config['cuota_mb'],
                'alerta_porcentaje' => $config['alerta_porcentaje'],
                'ultima_ejecucion' => $config['ultima_ejecucion']?->format('d/m/Y H:i'),
                'proxima_ejecucion' => $config['proxima_ejecucion']?->format('d/m/Y H:i'),
                'habilitado_en' => $config['habilitado_en']?->format('d/m/Y H:i'),
            ],
            'historial' => BackupEvento::with('user.persona')
                ->latest('created_at')
                ->latest('id')
                ->limit(50)
                ->get()
                ->map(fn (BackupEvento $evento): array => [
                    'id' => $evento->id,
                    'backup_nombre' => $evento->backup_nombre,
                    'accion' => $evento->accion,
                    'usuario' => $evento->user?->nombre_completo ?? 'Sistema',
                    'ip' => $evento->ip,
                    'detalle' => $evento->detalle,
                    'fecha' => $evento->created_at?->format('d/m/Y H:i:s'),
                ])
                ->all(),
            'puede' => [
                'crear' => $user->hasPermission('backups', 'creacion'),
                'editar' => $user->hasPermission('backups', 'edicion'),
                'eliminar' => $user->hasPermission('backups', 'baja'),
                'descargar' => $user->hasPermission('backups', 'descarga'),
                'restaurar' => $user->hasPermission('backups', 'restauracion'),
            ],
            'limite_importacion_mb' => max(1, (int) round($this->validador->maximoBytes() / 1048576)),
        ]);
    }

    public function espacio(): JsonResponse
    {
        return response()->json($this->espacio->datos());
    }

    public function eventos(Backup $backup): JsonResponse
    {
        $eventos = BackupEvento::with('user.persona')
            ->where('backup_id', $backup->id)
            ->orWhere(function ($query) use ($backup): void {
                $query->whereNull('backup_id')->where('backup_nombre', $backup->nombre);
            })
            ->latest('created_at')
            ->latest('id')
            ->limit(100)
            ->get()
            ->map(fn (BackupEvento $evento): array => [
                'id' => $evento->id,
                'backup_nombre' => $evento->backup_nombre,
                'accion' => $evento->accion,
                'usuario' => $evento->user?->nombre_completo ?? 'Sistema',
                'ip' => $evento->ip,
                'detalle' => $evento->detalle,
                'fecha' => $evento->created_at?->format('d/m/Y H:i:s'),
            ]);

        return response()->json(['data' => $eventos]);
    }

    public function store(Request $request): RedirectResponse
    {
        try {
            $backup = $this->backups->crearConBloqueo(
                Backup::TIPO_MANUAL,
                $request->user()->id,
                $request->ip(),
            );

            return back()->with('success', "Backup creado: {$backup->nombre}");
        } catch (Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function descargar(Request $request, Backup $backup): BinaryFileResponse
    {
        abort_unless($backup->estado === Backup::ESTADO_COMPLETADO, 404);

        $disco = Storage::disk($backup->disco);

        abort_unless($disco->exists($backup->ruta), 404, 'El archivo del backup no existe.');

        $this->backups->registrarEvento(
            $backup,
            BackupEvento::ACCION_DESCARGA,
            $request->user()->id,
            $request->ip(),
            'descarga desde el panel',
        );

        return response()->download($disco->path($backup->ruta), $backup->nombre, [
            'Content-Type' => 'application/gzip',
        ]);
    }

    public function proteger(Request $request, Backup $backup): RedirectResponse
    {
        $validated = $request->validate([
            'protegido' => ['required', 'boolean'],
        ]);

        $this->backups->proteger($backup, (bool) $validated['protegido']);

        return back()->with(
            'success',
            $validated['protegido'] ? 'Backup protegido.' : 'Protección retirada.',
        );
    }

    public function destroy(Request $request, Backup $backup): RedirectResponse
    {
        if ($backup->protegido) {
            return back()->with('error', 'El backup está protegido. Retire la protección antes de eliminarlo.');
        }

        $nombre = $backup->nombre;

        try {
            $this->backups->borrar(
                $backup,
                'eliminación manual',
                $request->user()->id,
                $request->ip(),
            );
        } catch (Throwable $e) {
            return back()->with('error', 'No se pudo eliminar el backup: '.$e->getMessage());
        }

        return back()->with('success', "Backup eliminado: {$nombre}");
    }

    public function updateAutomatizacion(UpdateAutomatizacionRequest $request): RedirectResponse
    {
        $this->programacion->actualizar($request->validated());
        $this->backups->aplicarRetencion();
        $this->espacio->invalidar();

        return back()->with('success', 'Configuración de backups actualizada.');
    }
}
