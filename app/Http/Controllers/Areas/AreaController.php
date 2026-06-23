<?php

namespace App\Http\Controllers\Areas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Areas\StoreAreaRequest;
use App\Http\Requests\Areas\UpdateAreaRequest;
use App\Http\Resources\AreaResource;
use App\Models\Area;
use App\Models\Puesto;
use App\Services\AreaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    public function __construct(
        private readonly AreaService $areaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Areas/Index', [
            'areas' => AreaResource::collection($this->areaService->listar(
                request()->only(['search', 'per_page'])
            )),
            'areasTree' => $this->areaService->obtenerArbolCompleto(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Areas/Create', [
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function store(StoreAreaRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $puestos = $data['puestos'] ?? [];
        unset($data['puestos']);

        $area = $this->areaService->crear($data, $puestos);

        return to_route('areas.show', $area)
            ->with('success', 'Área y puestos creados exitosamente.');
    }

    public function show(Area $area): Response
    {
        return Inertia::render('Areas/Show', [
            'area' => new AreaResource($this->areaService->obtenerConPuestos($area)),
        ]);
    }

    public function edit(Area $area): Response
    {
        return Inertia::render('Areas/Edit', [
            'area' => new AreaResource($this->areaService->obtenerConPuestos($area)),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function update(UpdateAreaRequest $request, Area $area): RedirectResponse
    {
        $data = $request->validated();
        $puestos = $data['puestos'] ?? null;
        unset($data['puestos']);

        $this->areaService->actualizar($area, $data, $puestos);

        return to_route('areas.show', $area)
            ->with('success', 'Área actualizada exitosamente.');
    }

    public function destroy(Area $area): RedirectResponse
    {
        $this->areaService->eliminar($area);

        return to_route('areas.index')
            ->with('success', 'Área eliminada exitosamente.');
    }

    public function storePuesto(Request $request, Area $area): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'sigla' => ['required', 'string', 'max:10', 'unique:puestos,sigla'],
            'estado' => ['nullable', 'boolean'],
        ]);

        $this->areaService->crearPuesto($area, $validated);

        return to_route('areas.show', $area)
            ->with('success', 'Puesto creado exitosamente.');
    }

    public function updatePuesto(Request $request, Area $area, Puesto $puesto): RedirectResponse
    {
        if ($puesto->area_id !== $area->id) {
            abort(404);
        }

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:1000'],
            'sigla' => ['required', 'string', 'max:10', Rule::unique('puestos', 'sigla')->ignore($puesto->id)],
            'estado' => ['nullable', 'boolean'],
        ]);

        $this->areaService->actualizarPuesto($puesto, $validated);

        return to_route('areas.show', $area)
            ->with('success', 'Puesto actualizado exitosamente.');
    }

    public function destroyPuesto(Area $area, Puesto $puesto): RedirectResponse
    {
        if ($puesto->area_id !== $area->id) {
            abort(404);
        }

        $this->areaService->eliminarPuesto($puesto);

        return to_route('areas.show', $area)
            ->with('success', 'Puesto eliminado exitosamente.');
    }
}
