<?php

namespace App\Http\Controllers\Funcionarios;

use App\Http\Controllers\Controller;
use App\Http\Requests\Funcionarios\CambiarPuestoRequest;
use App\Http\Requests\Funcionarios\StoreFuncionarioRequest;
use App\Http\Requests\Funcionarios\UpdateFuncionarioRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\FuncionarioListResource;
use App\Http\Resources\FuncionarioPuestoResource;
use App\Http\Resources\FuncionarioResource;
use App\Http\Resources\PuestoResource;
use App\Models\Funcionario;
use App\Services\AreaService;
use App\Services\FuncionarioService;
use App\Services\PuestoService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FuncionarioController extends Controller
{
    public function __construct(
        private readonly FuncionarioService $funcionarioService,
        private readonly AreaService $areaService,
        private readonly PuestoService $puestoService,
        private readonly UserService $userService,
    ) {}

    public function index(): Response
    {
        $user = request()->user();
        $filtros = request()->only(['search', 'area_id', 'estado']);
        $filtros['per_page'] = request()->input('per_page', $this->userService->getPerPage($user));

        return Inertia::render('Funcionarios/Index', [
            'funcionarios' => FuncionarioListResource::collection(
                $this->funcionarioService->listar($filtros)
            ),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
            'perPage' => (int) $filtros['per_page'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Funcionarios/Create', [
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
        ]);
    }

    public function store(StoreFuncionarioRequest $request): RedirectResponse
    {
        $funcionario = $this->funcionarioService->crear($request->validated(), $request->user());

        return to_route('funcionarios.show', $funcionario)
            ->with('success', 'Funcionario creado exitosamente.');
    }

    public function show(Funcionario $funcionario): Response
    {
        return Inertia::render('Funcionarios/Show', [
            'funcionario' => new FuncionarioResource(
                $this->funcionarioService->obtenerPorId($funcionario->id)
            ),
            'historial_puestos' => FuncionarioPuestoResource::collection(
                $this->funcionarioService->historialPuestos($funcionario)
            ),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
        ]);
    }

    public function cambiarPuesto(CambiarPuestoRequest $request, Funcionario $funcionario): RedirectResponse
    {
        $this->funcionarioService->cambiarPuesto(
            $funcionario,
            (int) $request->validated('puesto_id'),
            $request->user(),
        );

        return back()
            ->with('success', 'Puesto actualizado exitosamente.');
    }

    public function edit(Funcionario $funcionario): Response
    {
        return Inertia::render('Funcionarios/Edit', [
            'funcionario' => new FuncionarioResource($funcionario->load(['area', 'puesto'])),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
        ]);
    }

    public function update(UpdateFuncionarioRequest $request, Funcionario $funcionario): RedirectResponse
    {
        $funcionario = $this->funcionarioService->actualizar($funcionario, $request->validated(), $request->user());

        return to_route('funcionarios.show', $funcionario)
            ->with('success', 'Funcionario actualizado exitosamente.');
    }

    public function destroy(Request $request, Funcionario $funcionario): RedirectResponse
    {
        if (! $request->user()?->hasPermission('funcionarios', 'baja')) {
            return back()->with('error', 'No tienes permiso para eliminar funcionarios.');
        }

        try {
            $this->funcionarioService->eliminar($funcionario);

            return to_route('funcionarios.index')
                ->with('success', 'Funcionario eliminado exitosamente.');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
