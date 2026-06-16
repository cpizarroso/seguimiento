<?php

namespace App\Http\Controllers\Tramites;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tramites\StoreTramiteRequest;
use App\Http\Requests\Tramites\UpdateEstadoTramiteRequest;
use App\Http\Resources\FuncionarioResource;
use App\Http\Resources\PuestoResource;
use App\Http\Resources\TramiteResource;
use App\Models\Tramite;
use App\Services\FuncionarioService;
use App\Services\PuestoService;
use App\Services\TramiteService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TramiteController extends Controller
{
    public function __construct(
        private readonly TramiteService $tramiteService,
        private readonly PuestoService $puestoService,
        private readonly FuncionarioService $funcionarioService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Tramites/Index', [
            'tramites' => TramiteResource::collection(
                $this->tramiteService->listar(request()->only(['search', 'estado', 'puesto_id', 'fecha_desde', 'fecha_hasta']))
            ),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tramites/Create', [
            'puestos' => $this->puestoService->obtenerTodos(),
        ]);
    }

    public function store(StoreTramiteRequest $request): RedirectResponse
    {
        $user = $request->user();
        $funcionario = $user->funcionario ?? FuncionarioResource::collection(
            $this->funcionarioService->obtenerTodos()
        )->first();

        $tramite = $this->tramiteService->crear(
            $request->validated(),
            $request->user()->id
        );

        return to_route('tramites.show', $tramite)
            ->with('success', "Trámite N° {$tramite->numero_formateado}/{$tramite->year} creado exitosamente.");
    }

    public function show(Tramite $tramite): Response
    {
        $tramite = $this->tramiteService->obtenerPorId($tramite->id);

        return Inertia::render('Tramites/Show', [
            'tramite' => new TramiteResource($tramite),
            'funcionarios' => FuncionarioResource::collection($this->funcionarioService->obtenerTodos()),
        ]);
    }

    public function updateEstado(UpdateEstadoTramiteRequest $request, Tramite $tramite): RedirectResponse
    {
        $this->tramiteService->cambiarEstado($tramite, $request->input('estado'));

        return to_route('tramites.show', $tramite)
            ->with('success', "Estado actualizado a: {$tramite->estado}");
    }

    public function destroy(Tramite $tramite): RedirectResponse
    {
        $this->tramiteService->eliminar($tramite);

        return to_route('tramites.index')
            ->with('success', 'Trámite eliminado exitosamente.');
    }
}
