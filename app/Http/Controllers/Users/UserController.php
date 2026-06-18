<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ResetPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\PuestoResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AreaService;
use App\Services\PuestoService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
        private readonly AreaService $areaService,
        private readonly PuestoService $puestoService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => UserResource::collection($this->userService->listar(request()->only(['search']))),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->crear($request->validated());

        return to_route('users.index')
            ->with('success', 'Usuario creado exitosamente.');
    }

    public function show(User $user): Response
    {
        return Inertia::render('Users/Show', [
            'user' => new UserResource($user->load(['funcionario', 'puestoActivo.puesto.area', 'historialPuestos.puesto.area'])),
        ]);
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Users/Edit', [
            'user' => new UserResource($user->load('puestoActivo.puesto')),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
            'puestos' => PuestoResource::collection($this->puestoService->obtenerTodos()),
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

    public function resetPassword(ResetPasswordRequest $request, User $user): RedirectResponse
    {
        $this->userService->resetPassword($user, $request->input('password'));

        return to_route('users.show', $user->id)
            ->with('success', 'Contraseña reseteada exitosamente.');
    }
}
