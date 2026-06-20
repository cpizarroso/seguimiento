<?php

namespace App\Http\Controllers\Tramites;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tramites\StoreTramiteRequest;
use App\Http\Requests\Tramites\UpdateEstadoTramiteRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\TramiteResource;
use App\Http\Resources\UserResource;
use App\Models\Tramite;
use App\Models\User;
use App\Services\AreaService;
use App\Services\DerivacionService;
use App\Services\TramiteService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TramiteController extends Controller
{
    public function __construct(
        private readonly TramiteService $tramiteService,
        private readonly AreaService $areaService,
        private readonly DerivacionService $derivacionService,
        private readonly UserService $userService,
    ) {}

    public function index(): Response
    {
        $user = request()->user();
        $filtros = request()->only(['search', 'estado', 'fecha_desde', 'fecha_hasta', 'vista']);
        $filtros['per_page'] = request()->input('per_page', $this->userService->getPerPage($user));

        return Inertia::render('Tramites/Index', [
            'tramites' => TramiteResource::collection(
                $this->tramiteService->listar($filtros, $user?->id)
            ),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tramites/Create', [
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function store(StoreTramiteRequest $request): RedirectResponse
    {
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
            'usuarios' => UserResource::collection(User::all()),
        ]);
    }

    public function updateEstado(UpdateEstadoTramiteRequest $request, Tramite $tramite): RedirectResponse
    {
        $estado = $request->input('estado');

        if ($estado === 'observado') {
            $this->derivacionService->observar(
                $tramite,
                $request->input('derivado_a'),
                $request->input('glosa_observacion'),
            );

            return to_route('tramites.show', $tramite)
                ->with('success', 'Trámite observado y derivado exitosamente.');
        }

        $this->tramiteService->cambiarEstado($tramite, $estado, $request->only(['glosa_finalizacion']));

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
