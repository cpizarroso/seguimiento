<?php

namespace App\Http\Controllers\Puestos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Puestos\StorePuestoRequest;
use App\Http\Requests\Puestos\UpdatePuestoRequest;
use App\Http\Resources\PuestoResource;
use App\Models\Puesto;
use App\Services\PuestoService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PuestoController extends Controller
{
    public function __construct(
        private readonly PuestoService $puestoService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Puestos/Index', [
            'puestos' => PuestoResource::collection($this->puestoService->listar(request()->only(['search']))),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Puestos/Create');
    }

    public function store(StorePuestoRequest $request): RedirectResponse
    {
        $this->puestoService->crear($request->validated());

        return to_route('puestos.index')
            ->with('success', 'Puesto creado exitosamente.');
    }

    public function edit(Puesto $puesto): Response
    {
        return Inertia::render('Puestos/Edit', [
            'puesto' => new PuestoResource($puesto),
        ]);
    }

    public function update(UpdatePuestoRequest $request, Puesto $puesto): RedirectResponse
    {
        $this->puestoService->actualizar($puesto, $request->validated());

        return to_route('puestos.index')
            ->with('success', 'Puesto actualizado exitosamente.');
    }

    public function destroy(Puesto $puesto): RedirectResponse
    {
        $this->puestoService->eliminar($puesto);

        return to_route('puestos.index')
            ->with('success', 'Puesto eliminado exitosamente.');
    }
}
