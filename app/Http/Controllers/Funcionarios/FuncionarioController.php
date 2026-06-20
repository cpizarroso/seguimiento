<?php

namespace App\Http\Controllers\Funcionarios;

use App\Http\Controllers\Controller;
use App\Http\Requests\Funcionarios\StoreFuncionarioRequest;
use App\Http\Requests\Funcionarios\UpdateFuncionarioRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\FuncionarioListResource;
use App\Http\Resources\FuncionarioResource;
use App\Models\Funcionario;
use App\Services\AreaService;
use App\Services\FuncionarioService;
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
        private readonly UserService $userService,
    ) {}

    public function index(): Response
    {
        $user = request()->user();
        $filtros = request()->only(['search', 'area_id']);
        $filtros['per_page'] = request()->input('per_page', $this->userService->getPerPage($user));

        return Inertia::render('Funcionarios/Index', [
            'funcionarios' => FuncionarioListResource::collection(
                $this->funcionarioService->listar($filtros)
            ),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'perPage' => (int) $filtros['per_page'],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Funcionarios/Create', [
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function store(StoreFuncionarioRequest $request): RedirectResponse
    {
        $this->funcionarioService->crear($request->validated(), $request->user());

        return to_route('funcionarios.index')
            ->with('success', 'Funcionario creado exitosamente.');
    }

    public function show(Funcionario $funcionario): Response
    {
        return Inertia::render('Funcionarios/Show', [
            'funcionario' => new FuncionarioResource(
                $this->funcionarioService->obtenerPorId($funcionario->id)
            ),
        ]);
    }

    public function edit(Funcionario $funcionario): Response
    {
        return Inertia::render('Funcionarios/Edit', [
            'funcionario' => new FuncionarioResource($funcionario->load('area')),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function update(UpdateFuncionarioRequest $request, Funcionario $funcionario): RedirectResponse
    {
        $this->funcionarioService->actualizar($funcionario, $request->validated());

        return to_route('funcionarios.index')
            ->with('success', 'Funcionario actualizado exitosamente.');
    }

    public function destroy(Request $request, Funcionario $funcionario): RedirectResponse
    {
        if ($request->user()?->role !== 'admin') {
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
