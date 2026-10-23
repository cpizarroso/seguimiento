<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Http\Resources\AreaResource;
use App\Services\AreaService;
use App\Services\ConfiguracionService;
use App\Services\ContadorTramiteService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ConfiguracionController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
        private readonly AreaService $areaService,
        private readonly ContadorTramiteService $contadorService,
        private readonly ConfiguracionService $configuracionService,
    ) {}

    public function index(): Response
    {
        $user = request()->user();
        $perPage = $this->userService->getPerPage($user);

        $areas = $this->areaService->obtenerTodos();
        $contadores = $areas->map(fn ($area) => [
            'area' => new AreaResource($area),
            'contador' => $this->contadorService->obtenerContador($area->id),
        ]);

        return Inertia::render('Configuracion/Index', [
            'perPage' => $perPage,
            'contadores' => $contadores,
            'gestionInicial' => $this->configuracionService->obtenerGestionInicial(),
            'gestionesConfigurables' => $this->configuracionService->gestionesConfigurables(),
            'puedeConfigurarReporte' => $user->hasPermission('configuracion', 'edicion'),
        ]);
    }

    public function updatePerPage(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'per_page' => 'required|integer|in:5,10',
        ]);

        $this->userService->setSetting(
            $request->user(),
            'per_page',
            (int) $validated['per_page'],
        );

        return to_route('configuracion.index')
            ->with('success', 'Configuración actualizada exitosamente.');
    }

    public function updateGestionInicial(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'gestion_inicial' => [
                'required',
                'integer',
                Rule::in($this->configuracionService->gestionesConfigurables()),
            ],
        ], [
            'gestion_inicial.in' => 'La gestión inicial seleccionada no es válida.',
        ]);

        $this->configuracionService->actualizarGestionInicial((int) $validated['gestion_inicial']);

        return to_route('configuracion.index')
            ->with('success', 'Gestión inicial del reporte actualizada.');
    }
}
