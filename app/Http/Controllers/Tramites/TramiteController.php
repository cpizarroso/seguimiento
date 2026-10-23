<?php

namespace App\Http\Controllers\Tramites;

use App\Exports\TramitesExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tramites\StoreTramiteRequest;
use App\Http\Requests\Tramites\UpdateEstadoTramiteRequest;
use App\Http\Requests\Tramites\UpdateTramiteRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\TramiteResource;
use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use App\Services\AreaService;
use App\Services\DerivacionService;
use App\Services\TramiteService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
        $filtros = $this->filtros();
        $filtros['per_page'] = request()->input('per_page', $this->userService->getPerPage($user));

        return Inertia::render('Tramites/Index', [
            'tramites' => TramiteResource::collection(
                $this->tramiteService->listar($filtros)
            ),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'areasCreacion' => AreaResource::collection($this->areasParaCrear($user)),
            'destinatarios' => $this->destinatariosDerivacion($user),
        ]);
    }

    public function export(): BinaryFileResponse
    {
        return Excel::download(
            new TramitesExport($this->tramiteService, $this->filtros()),
            'tramites-'.now()->format('Ymd-His').'.xlsx'
        );
    }

    /**
     * Filtros permitidos del listado y la exportación.
     *
     * @return array<string, mixed>
     */
    private function filtros(): array
    {
        request()->validate([
            'fecha_desde' => ['nullable', 'date_format:Y-m-d'],
            'fecha_hasta' => ['nullable', 'date_format:Y-m-d'],
            'numero_tramite' => ['nullable', 'string', 'max:50'],
            'numero_diamante' => ['nullable', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'recepcion' => ['nullable', 'in:todos,por_recepcionar,recepcionados'],
        ]);

        return request()->only([
            'search',
            'estado',
            'area_id',
            'numero_tramite',
            'numero_diamante',
            'descripcion',
            'fecha_desde',
            'fecha_hasta',
            'urgente',
            'hoy',
            'recepcion',
            'sort',
            'direction',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Tramites/Create', [
            'areas' => AreaResource::collection($this->areasParaCrear(request()->user())),
        ]);
    }

    /**
     * Áreas en las que el usuario puede crear trámites (admin ve todas).
     *
     * @return Collection<int, Area>
     */
    private function areasParaCrear(User $user)
    {
        if ($user->esAdmin()) {
            return $this->areaService->obtenerTodos();
        }

        return $user->areasHabilitadas()->orderBy('nombre')->get();
    }

    /**
     * Personas con usuario que pueden recibir derivaciones.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function destinatariosDerivacion(?User $user): Collection
    {
        if (! $user || ! $user->hasPermission('tramites', 'edicion')) {
            return collect();
        }

        return $this->derivacionService->destinatariosParaDerivar($user->id);
    }

    public function store(StoreTramiteRequest $request): RedirectResponse
    {
        $tramite = $this->tramiteService->crear(
            $request->validated(),
            $request->user()->id
        );

        return to_route('tramites.show', $tramite)
            ->with('success', "Trámite N° {$tramite->numero_completo} creado exitosamente.");
    }

    public function show(Tramite $tramite): Response
    {
        $tramite = $this->tramiteService->obtenerPorId($tramite->id);

        return Inertia::render('Tramites/Show', [
            'tramite' => new TramiteResource($tramite),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'destinatarios' => $this->destinatariosDerivacion(request()->user()),
        ]);
    }

    public function edit(Tramite $tramite): Response
    {
        return Inertia::render('Tramites/Edit', [
            'tramite' => new TramiteResource($this->tramiteService->obtenerPorId($tramite->id)),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function update(UpdateTramiteRequest $request, Tramite $tramite): RedirectResponse
    {
        $this->tramiteService->actualizar($tramite, $request->validated());

        return to_route('tramites.show', $tramite)
            ->with('success', "Trámite N° {$tramite->numero_completo} actualizado exitosamente.");
    }

    public function updateEstado(UpdateEstadoTramiteRequest $request, Tramite $tramite): RedirectResponse
    {
        $estado = $request->input('estado');

        if ($estado === 'observado') {
            $usuarioId = (int) $request->user()?->id;

            abort_if(
                ! $this->derivacionService->puedeDerivar($tramite, $usuarioId) || $tramite->estado !== 'proceso',
                403,
                'No tienes permiso para observar este trámite.'
            );

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
