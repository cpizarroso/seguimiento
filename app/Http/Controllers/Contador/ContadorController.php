<?php

namespace App\Http\Controllers\Contador;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contador\ReiniciarContadorRequest;
use App\Http\Resources\PuestoResource;
use App\Services\ContadorTramiteService;
use App\Services\PuestoService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContadorController extends Controller
{
    public function __construct(
        private readonly ContadorTramiteService $contadorService,
        private readonly PuestoService $puestoService,
    ) {}

    public function index(): Response
    {
        $puestos = $this->puestoService->obtenerTodos();
        $contadores = $puestos->map(fn ($puesto) => [
            'puesto' => new PuestoResource($puesto),
            'contador' => $this->contadorService->obtenerContador($puesto->id),
        ]);

        return Inertia::render('Contador/Index', [
            'contadores' => $contadores,
        ]);
    }

    public function reiniciar(ReiniciarContadorRequest $request): RedirectResponse
    {
        $this->contadorService->reiniciar(
            $request->input('puesto_id'),
            $request->input('glosa'),
        );

        return to_route('contador.index')
            ->with('success', 'Contador reiniciado exitosamente.');
    }
}
