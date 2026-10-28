<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ResetPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateEstadoUsuarioRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\PersonaResource;
use App\Http\Resources\RolResource;
use App\Http\Resources\UserResource;
use App\Models\Rol;
use App\Models\User;
use App\Services\AreaService;
use App\Services\PersonaService;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
        private readonly PersonaService $personaService,
        private readonly AreaService $areaService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => UserResource::collection(
                $this->userService->listar(
                    request()->only(['search', 'role_id', 'area_id', 'per_page'])
                )
            ),
            'roles' => RolResource::collection(Rol::with('permisos.modulo', 'permisos.accion')->get()),
            'personas' => PersonaResource::collection($this->personaService->obtenerTodos()),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Users/Create', [
            'roles' => RolResource::collection(Rol::with('permisos.modulo', 'permisos.accion')->get()),
            'personas' => PersonaResource::collection($this->personaService->obtenerTodos()),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->userService->crear($request->validated());

        // Desde la página de creación se vuelve a ella para mostrar el reporte
        // de acceso conservando el estado del formulario; desde el índice se
        // recarga el listado y el modal muestra el mismo reporte.
        $destino = $request->query('desde') === 'create'
            ? route('users.create')
            : route('users.index');

        return redirect()->to($destino)
            ->with('success', 'Usuario creado exitosamente.');
    }

    public function show(User $user): Response
    {
        $user->load([
            'persona.puestoActivo.puesto.area',
            'persona.historialPuestos.puesto.area',
            'roles.permisos',
            'areasHabilitadas',
        ]);

        return Inertia::render('Users/Show', [
            'user' => new UserResource($user),
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load('persona.puestoActivo.puesto.area', 'roles', 'areasHabilitadas');

        return Inertia::render('Users/Edit', [
            'user' => new UserResource($user),
            'roles' => RolResource::collection(Rol::with('permisos.modulo', 'permisos.accion')->get()),
            'personas' => PersonaResource::collection($this->personaService->obtenerTodos()),
            'areas' => AreaResource::collection($this->areaService->obtenerTodos()),
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
        // Si el admin resetea su propia contraseña, conserva la sesión en curso
        // para no perder el reporte recién generado.
        $exceptSessionId = $user->is($request->user()) ? $request->session()->getId() : null;

        $this->userService->resetPassword($user, $request->input('password'), $exceptSessionId);

        return back()->with('success', 'Contraseña reseteada exitosamente.');
    }

    public function cambiarEstado(UpdateEstadoUsuarioRequest $request, User $user): RedirectResponse
    {
        $activo = $request->boolean('activo');

        $this->userService->cambiarEstado($user, $activo);

        return back()->with(
            'success',
            $activo ? 'Usuario activado exitosamente.' : 'Usuario desactivado exitosamente.'
        );
    }
}
