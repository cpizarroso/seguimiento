<?php

namespace App\Http\Controllers\Funcionarios;

use App\Http\Controllers\Controller;
use App\Http\Requests\Funcionarios\StoreFuncionarioRequest;
use App\Http\Requests\Funcionarios\UpdateFuncionarioRequest;
use App\Http\Resources\FuncionarioResource;
use App\Models\Funcionario;
use App\Services\FuncionarioService;
use App\Services\PuestoService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FuncionarioController extends Controller
{
    public function __construct(
        private readonly FuncionarioService $funcionarioService,
        private readonly PuestoService $puestoService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Funcionarios/Index', [
            'funcionarios' => FuncionarioResource::collection(
                $this->funcionarioService->listar(request()->only(['search']))
            ),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Funcionarios/Create', [
            'puestos' => $this->puestoService->obtenerTodos()->values()->all(),
        ]);
    }

    public function store(StoreFuncionarioRequest $request): RedirectResponse
    {
        $this->funcionarioService->crear($request->validated());

        return to_route('funcionarios.index')
            ->with('success', 'Funcionario creado exitosamente.');
    }

    public function edit(Funcionario $funcionario): Response
    {
        return Inertia::render('Funcionarios/Edit', [
            'funcionario' => new FuncionarioResource($funcionario->load('puesto')),
            'puestos' => $this->puestoService->obtenerTodos()->values()->all(),
        ]);
    }

    public function update(UpdateFuncionarioRequest $request, Funcionario $funcionario): RedirectResponse
    {
        $this->funcionarioService->actualizar($funcionario, $request->validated());

        return to_route('funcionarios.index')
            ->with('success', 'Funcionario actualizado exitosamente.');
    }

    public function destroy(Funcionario $funcionario): RedirectResponse
    {
        $this->funcionarioService->eliminar($funcionario);

        return to_route('funcionarios.index')
            ->with('success', 'Funcionario eliminado exitosamente.');
    }
}
