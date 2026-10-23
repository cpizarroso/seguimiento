<?php

namespace App\Http\Controllers\Personas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Personas\CambiarPuestoRequest;
use App\Http\Requests\Personas\StorePersonaRequest;
use App\Http\Requests\Personas\UpdatePersonaRequest;
use App\Http\Resources\PersonaResource;
use App\Models\Persona;
use App\Models\Puesto;
use App\Services\AreaService;
use App\Services\PersonaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PersonaController extends Controller
{
    public function __construct(
        private readonly PersonaService $personaService,
        private readonly AreaService $areaService,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('Personas/Index', [
            'personas' => PersonaResource::collection(
                $this->personaService->listar($request->only(['search', 'area_id', 'puesto_id', 'activo', 'per_page']))
            ),
            'areas' => $this->areaService->obtenerOpciones(),
            'puestos' => Puesto::with('area:id,nombre,codigo')
                ->select(['id', 'nombre', 'codigo', 'area_id', 'activo'])
                ->orderBy('nombre')
                ->get(),
            'filters' => $request->only(['search', 'area_id', 'puesto_id', 'activo']),
        ]);
    }

    public function store(StorePersonaRequest $request): RedirectResponse
    {
        $this->personaService->crear($request->validated(), $request->user());

        return to_route('personas.index')->with('success', 'Persona creada exitosamente.');
    }

    public function update(UpdatePersonaRequest $request, Persona $persona): RedirectResponse
    {
        $this->personaService->actualizar($persona, $request->validated(), $request->user());

        return to_route('personas.index')->with('success', 'Persona actualizada exitosamente.');
    }

    public function destroy(Persona $persona): RedirectResponse
    {
        $this->personaService->eliminar($persona);

        return to_route('personas.index')->with('success', 'Persona eliminada exitosamente.');
    }

    public function toggleActivo(Persona $persona): RedirectResponse
    {
        $this->personaService->toggleActivo($persona);

        return to_route('personas.index')->with('success', 'Estado de la persona actualizado.');
    }

    public function cambiarPuesto(CambiarPuestoRequest $request, Persona $persona): RedirectResponse
    {
        $this->personaService->cambiarPuesto(
            $persona,
            (int) $request->input('puesto_id'),
            $request->input('fecha_inicio'),
        );

        return to_route('personas.index')->with('success', 'Puesto actualizado. El puesto anterior quedó en el historial.');
    }
}
