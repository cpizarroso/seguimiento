<?php

namespace App\Http\Controllers\Contador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contador\ReiniciarContadorRequest;
use App\Http\Resources\AreaResource;
use App\Services\AreaService;
use App\Services\ContadorTramiteService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContadorController extends Controller
{
    public function __construct(
        private readonly ContadorTramiteService $contadorService,
        private readonly AreaService $areaService,
    ) {}

    public function index(): Response
    {
        $areas = $this->areaService->obtenerTodos();
        $contadores = $areas->map(fn ($area) => [
            'area' => new AreaResource($area),
            'contador' => $this->contadorService->obtenerContador($area->id),
        ]);

        return Inertia::render('Contador/Index', [
            'contadores' => $contadores,
        ]);
    }

    public function reiniciar(ReiniciarContadorRequest $request): RedirectResponse
    {
        $this->contadorService->reiniciar(
            $request->input('area_id'),
            $request->input('glosa'),
        );

        return to_route('contador.index')
            ->with('success', 'Contador reiniciado exitosamente.');
    }
}
