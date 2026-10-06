<?php

namespace App\Http\Controllers;

use App\Http\Requests\Reportes\ReporteTramitesRequest;
use App\Http\Resources\TramiteResource;
use App\Services\ReporteService;
use Barryvdh\DomPDF\Facade\Pdf;
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
        private readonly ReporteService $reporteService
    ) {}

    public function index(ReporteTramitesRequest $request): Response
    {
        $user = $request->user()->loadMissing('funcionario.area', 'puestoActivo.puesto.area');
        $filtros = $request->filtros();
        $filtros['per_page'] = $request->input('per_page', ReporteService::PER_PAGE_DOCUMENTO);

        $area = $user->funcionario?->area?->nombre
            ?? $user->puestoActivo?->puesto?->area?->nombre;

        $authUsuario = [
            'id' => $user->id,
            'name' => $user->name,
            'area' => $area,
            'area_id' => $user->funcionario?->area_id
                ?? $user->puestoActivo?->puesto?->area_id,
        ];

        $quiereReporte = $request->has('fecha_desde')
            || $request->has('fecha_hasta')
            || $request->boolean('hoy');

        $reporte = $quiereReporte
            ? TramiteResource::collection(
                $this->reporteService->ingresadosPaginados($authUsuario['area_id'], $filtros)
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
            'auth_usuario' => $authUsuario,
            'filtros' => $filtros,
            'generado' => $quiereReporte,
            'reporte' => $reporte,
            'archivo' => $this->archivoProp($request, $user->id),
            'vista_previa_url' => $quiereReporte
                ? $this->generarVistaPrevia($user->id, $user->name, $area, $authUsuario['area_id'], $filtros)
                : null,
            'historial' => $user->reportes()->latest()->limit(10)->get()->map(fn ($r) => [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'fecha_desde' => $r->fecha_desde?->format('d/m/Y'),
                'fecha_hasta' => $r->fecha_hasta?->format('d/m/Y'),
                'hoy' => $r->hoy,
                'total_registros' => $r->total_registros,
                'creado_en' => $r->created_at?->format('d/m/Y H:i'),
                'url' => route('reporte.descargar', ['archivo' => $r->ruta]),
            ])->all(),
        ]);
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
        $user = $request->user()->loadMissing('funcionario.area', 'puestoActivo.puesto.area');
        $filtros = $request->filtros();

        $area = $user->funcionario?->area?->nombre
            ?? $user->puestoActivo?->puesto?->area?->nombre;

        $areaId = $user->funcionario?->area_id
            ?? $user->puestoActivo?->puesto?->area_id;

        $tmpRuta = $this->rutaTemporal($user->id);

        if (! Storage::disk('local')->exists($tmpRuta)) {
            // Sin vista previa generada: se crea el mismo documento.
            $tramites = $this->reporteService->ingresadosColeccion($areaId, $filtros);
            Storage::disk('local')->put($tmpRuta, $this->pdfBytes($user->name, $area, $filtros, $tramites));
        }

        $ruta = sprintf(
            'reportes/reporte-usuario-%d-%s.pdf',
            $user->id,
            now()->format('Ymd-His')
        );

        // Se archiva el documento mostrado en la vista previa.
        Storage::disk('local')->move($tmpRuta, $ruta);

        $request->user()->reportes()->create([
            'ruta' => $ruta,
            'nombre' => basename($ruta),
            'fecha_desde' => $filtros['fecha_desde'],
            'fecha_hasta' => $filtros['fecha_hasta'],
            'hoy' => $filtros['hoy'],
            'total_registros' => $this->reporteService->ingresadosQuery($areaId, $filtros)->count(),
        ]);

        return to_route('reporte.index', [
            ...$filtros,
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
            return \Carbon\Carbon::parse($fecha)->format('d/m/Y');
        } catch (\Throwable) {
            return $fecha;
        }
    }
}
