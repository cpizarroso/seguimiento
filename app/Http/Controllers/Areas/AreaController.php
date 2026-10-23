<?php

namespace App\Http\Controllers\Areas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Areas\StoreAreaRequest;
use App\Http\Requests\Areas\UpdateAreaRequest;
use App\Http\Requests\Puestos\StorePuestoRequest;
use App\Http\Requests\Puestos\UpdatePuestoRequest;
use App\Models\Area;
use App\Models\Puesto;
use App\Models\User;
use App\Services\AreaService;
use Illuminate\Http\RedirectResponse;
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
            'areasTree' => $this->areaService->obtenerArbolCompleto(),
            'areasOpciones' => $this->areaService->obtenerOpciones(),
            'responsables' => User::orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(StoreAreaRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $puestosEstandar = $data['puestos_estandar'] ?? [];
        unset($data['puestos_estandar']);

        $this->areaService->crear($data, $puestosEstandar);

        return to_route('areas.index')->with('success', 'Área creada exitosamente.');
    }

    public function update(UpdateAreaRequest $request, Area $area): RedirectResponse
    {
        $this->areaService->actualizar($area, $request->validated());

        return to_route('areas.index')->with('success', 'Área actualizada exitosamente.');
    }

    public function destroy(Area $area): RedirectResponse
    {
        $this->areaService->eliminar($area);

        return to_route('areas.index')->with('success', 'Área eliminada exitosamente.');
    }

    public function toggleActivo(Area $area): RedirectResponse
    {
        $this->areaService->toggleActivo($area);

        return to_route('areas.index')->with('success', 'Estado del área actualizado.');
    }

    public function storePuesto(StorePuestoRequest $request, Area $area): RedirectResponse
    {
        $data = $request->validated();
        $data['area_id'] = $area->id;

        $this->areaService->crearPuesto($area, $data);

        return to_route('areas.index')->with('success', 'Puesto creado exitosamente.');
    }

    public function updatePuesto(UpdatePuestoRequest $request, Area $area, Puesto $puesto): RedirectResponse
    {
        abort_unless($puesto->area_id === $area->id, 404);

        $data = $request->validated();
        $data['area_id'] = $area->id;

        $this->areaService->actualizarPuesto($puesto, $data);

        return to_route('areas.index')->with('success', 'Puesto actualizado exitosamente.');
    }

    public function destroyPuesto(Area $area, Puesto $puesto): RedirectResponse
    {
        abort_unless($puesto->area_id === $area->id, 404);

        $this->areaService->eliminarPuesto($puesto);

        return to_route('areas.index')->with('success', 'Puesto eliminado exitosamente.');
    }

    public function togglePuesto(Area $area, Puesto $puesto): RedirectResponse
    {
        abort_unless($puesto->area_id === $area->id, 404);

        $this->areaService->togglePuesto($puesto);

        return to_route('areas.index')->with('success', 'Estado del puesto actualizado.');
    }
}
