<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reportes\ReporteTramitesRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\TramiteResource;
use App\Models\Area;
use App\Models\User;
use App\Services\AreaService;
use App\Services\ConfiguracionService;
use App\Services\ReporteService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReporteController extends Controller
{
    public function __construct(
        private readonly ReporteService $reporteService,
        private readonly AreaService $areaService,
        private readonly ConfiguracionService $configuracionService,
    ) {}

    public function index(ReporteTramitesRequest $request): Response
    {
        $contexto = $this->contextoReporte($request);
        $user = $contexto['user'];
        $filtros = $request->filtros();
        $filtros['area_id'] = $contexto['areaId'];
        $filtros['per_page'] = $request->input('per_page', ReporteService::PER_PAGE_DOCUMENTO);

        $quiereReporte = $request->has('fecha_desde')
            || $request->has('fecha_hasta')
            || $request->has('gestion')
            || $request->boolean('hoy')
            || filled($filtros['numero_tramite'] ?? null);

        $reporte = $quiereReporte
            ? TramiteResource::collection(
                $this->reporteService->ingresadosPaginados($contexto['areaId'], $filtros)
            )
            : ['data' => [], 'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => (int) $filtros['per_page'],
                'total' => 0,
                'from' => null,
                'to' => null,
            ]];

        return Inertia::render('Reporte/Index', [
            'auth_usuario' => [
                'id' => $user->id,
                'name' => $user->name,
                'area' => $contexto['areaUsuario']?->nombre,
                'area_id' => $contexto['areaUsuario']?->id,
            ],
            'area_reporte' => $contexto['area'] ? new AreaResource($contexto['area']) : null,
            'areas' => $contexto['esAdmin']
                ? AreaResource::collection($this->areaService->obtenerTodos())
                : ['data' => []],
            'puede_seleccionar_area' => $contexto['esAdmin'],
            'filtros' => $filtros,
            'gestiones' => $this->configuracionService->gestionesDisponibles(),
            'gestion_actual' => (int) now()->year,
            'generado' => $quiereReporte,
            'reporte' => $reporte,
            'archivo' => $this->archivoProp($request, $user->id),
            'vista_previa_url' => $quiereReporte
                ? $this->generarVistaPrevia(
                    $user->id,
                    $user->name,
                    $contexto['area']?->nombre,
                    $contexto['areaId'],
                    $filtros,
                )
                : null,
            'historial' => $user->reportes()->latest()->limit(10)->get()->map(fn ($r) => [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'fecha_desde' => $r->fecha_desde?->format('d/m/Y'),
                'fecha_hasta' => $r->fecha_hasta?->format('d/m/Y'),
                'hoy' => $r->hoy,
                'gestion' => $r->gestion,
                'total_registros' => $r->total_registros,
                'creado_en' => $r->created_at?->format('d/m/Y H:i'),
                'url' => route('reporte.descargar', ['archivo' => $r->ruta]),
            ])->all(),
        ]);
    }

    /**
     * Resuelve el área del reporte y aplica la restricción por rol.
     *
     * @return array{
     *     user: User,
     *     esAdmin: bool,
     *     areaUsuario: ?Area,
     *     area: ?Area,
     *     areaId: ?int
     * }
     */
    private function contextoReporte(ReporteTramitesRequest $request): array
    {
        $user = $request->user()->loadMissing(['persona.puestoActivo.puesto.area', 'roles']);
        $esAdmin = $user->esAdmin();
        $areaUsuario = $user->persona?->puestoActivo?->puesto?->area;
        $areaUsuarioId = $areaUsuario?->id;
        $areaSolicitadaId = $request->filled('area_id') ? (int) $request->input('area_id') : null;
        $areaId = $esAdmin ? ($areaSolicitadaId ?? $areaUsuarioId) : $areaUsuarioId;

        return [
            'user' => $user,
            'esAdmin' => $esAdmin,
            'areaUsuario' => $areaUsuario,
            'area' => $areaId !== null ? Area::find($areaId) : null,
            'areaId' => $areaId,
        ];
    }

    /**
     * Genera el PDF con los datos del reporte y lo guarda como temporal
     * para mostrarlo en el visor de la vista previa.
     */
    private function generarVistaPrevia(int $userId, string $usuario, ?string $area, ?int $areaId, array $filtros): string
    {
        $coleccion = $this->reporteService->ingresadosColeccion($areaId, $filtros);

        Storage::disk('local')->put(
            $this->rutaTemporal($userId),
            $this->pdfBytes($usuario, $area, $filtros, $coleccion)
        );

        return route('reporte.vista-previa');
    }

    public function vistaPrevia(Request $request): BinaryFileResponse
    {
        $ruta = $this->rutaTemporal((int) $request->user()->id);

        abort_unless(Storage::disk('local')->exists($ruta), 404);

        return response()->file(Storage::disk('local')->path($ruta), ['Content-Type' => 'application/pdf']);
    }

    public function guardar(ReporteTramitesRequest $request): RedirectResponse
    {
        $contexto = $this->contextoReporte($request);
        $user = $contexto['user'];
        $filtros = $request->filtros();
        $filtros['area_id'] = $contexto['areaId'];

        $tmpRuta = $this->rutaTemporal($user->id);

        if (! Storage::disk('local')->exists($tmpRuta)) {
            // Sin vista previa generada: se crea el mismo documento.
            $tramites = $this->reporteService->ingresadosColeccion($contexto['areaId'], $filtros);
            Storage::disk('local')->put(
                $tmpRuta,
                $this->pdfBytes($user->name, $contexto['area']?->nombre, $filtros, $tramites)
            );
        }

        $ruta = sprintf(
            'reportes/reporte-usuario-%d-%s.pdf',
            $user->id,
            now()->format('Ymd-His')
        );

        // Se archiva el documento mostrado en la vista previa.
        Storage::disk('local')->move($tmpRuta, $ruta);

        $user->reportes()->create([
            'ruta' => $ruta,
            'nombre' => basename($ruta),
            'fecha_desde' => $filtros['fecha_desde'],
            'fecha_hasta' => $filtros['fecha_hasta'],
            'hoy' => $filtros['hoy'],
            'gestion' => $filtros['gestion'],
            'total_registros' => $this->reporteService->ingresadosQuery($contexto['areaId'], $filtros)->count(),
        ]);

        return to_route('reporte.index', [
            ...$filtros,
            // Null significa "todas", pero un parámetro null se omite de la URL
            // y el backend volvería a aplicar la gestión actual por defecto.
            'gestion' => $filtros['gestion'] ?? 0,
            'archivo' => $ruta,
        ])->with('success', 'Reporte guardado en el storage.');
    }

    public function descargar(Request $request): BinaryFileResponse
    {
        $ruta = (string) $request->query('archivo', '');

        abort_unless($this->esArchivoPropio($ruta, (int) $request->user()->id), 404);
        abort_unless(Storage::disk('local')->exists($ruta), 404);

        $absoluto = Storage::disk('local')->path($ruta);

        return response()->download($absoluto, basename($ruta), ['Content-Type' => 'application/pdf']);
    }

    /**
     * @return array{path: string, url: string}|null
     */
    private function archivoProp(Request $request, int $userId): ?array
    {
        $ruta = (string) $request->query('archivo', '');

        if ($ruta === '' || ! $this->esArchivoPropio($ruta, $userId)) {
            return null;
        }

        if (! Storage::disk('local')->exists($ruta)) {
            return null;
        }

        return [
            'path' => $ruta,
            'url' => route('reporte.descargar', ['archivo' => $ruta]),
        ];
    }

    private function esArchivoPropio(string $ruta, int $userId): bool
    {
        return str_starts_with($ruta, 'reportes/')
            && str_contains($ruta, "reporte-usuario-{$userId}-")
            && str_ends_with($ruta, '.pdf')
            && ! str_contains($ruta, '..');
    }

    private function rutaTemporal(int $userId): string
    {
        return "tmp/reportes/reporte-preview-usuario-{$userId}.pdf";
    }

    private function pdfBytes(string $usuario, ?string $area, array $filtros, Collection $tramites): string
    {
        return Pdf::loadView('reportes.tramites-ingresados', [
            'tramites' => $tramites,
            'totalRegistros' => $tramites->count(),
            'fechaDesde' => $this->formatearFecha($filtros['fecha_desde']),
            'fechaHasta' => $this->formatearFecha($filtros['fecha_hasta']),
            'gestion' => $filtros['gestion'] ?? null,
            'numeroTramite' => $filtros['numero_tramite'] ?? null,
            'usuario' => $usuario,
            'area' => $area,
        ])->setPaper('letter')->setOption('enable_php', true)->output();
    }

    private function formatearFecha(?string $fecha): ?string
    {
        if ($fecha === null || $fecha === '') {
            return null;
        }

        try {
            return Carbon::parse($fecha)->format('d/m/Y');
        } catch (\Throwable) {
            return $fecha;
        }
    }
}
