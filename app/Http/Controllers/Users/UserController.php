<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Models\Funcionario;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => $this->userService->listar(request()->only(['search'])),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'funcionarios' => Funcionario::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->crear($request->validated());

        return to_route('users.index')
            ->with('success', 'Usuario creado exitosamente.');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Users/Edit', [
            'user' => $user->load('funcionario'),
            'funcionarios' => Funcionario::orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->actualizar($user, $request->validated());

        return to_route('users.index')
            ->with('success', 'Usuario actualizado exitosamente.');
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->userService->eliminar($user);

        return to_route('users.index')
            ->with('success', 'Usuario eliminado exitosamente.');
    }
}
