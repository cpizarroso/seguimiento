<?php

namespace App\Http\Controllers\Roles;

use App\Http\Controllers\Controller;
use App\Http\Requests\Roles\StoreRolRequest;
use App\Http\Requests\Roles\UpdateRolRequest;
use App\Http\Resources\RolResource;
use App\Models\Rol;
use App\Services\RolService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RolController extends Controller
{
    public function __construct(
        private readonly RolService $rolService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Roles/Index', [
            'roles' => RolResource::collection($this->rolService->listar()),
            'permisos_agrupados' => $this->rolService->permisosAgrupados(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Roles/Create', [
            'permisos_agrupados' => $this->rolService->permisosAgrupados(),
        ]);
    }

    public function edit(Rol $role): Response
    {
        $role->load('permisos.modulo', 'permisos.accion');

        return Inertia::render('Roles/Edit', [
            'rol' => [
                'id' => $role->id,
                'nombre' => $role->nombre,
                'slug' => $role->slug,
                'descripcion' => $role->descripcion,
                'es_sistema' => $role->es_sistema,
                'permiso_ids' => $role->permisos->pluck('id')->toArray(),
                'permisos' => $role->permisos->map(fn ($p) => [
                    'id' => $p->id,
                    'modulo' => $p->modulo->slug,
                    'accion' => $p->accion->slug,
                ])->toArray(),
            ],
            'permisos_agrupados' => $this->rolService->permisosAgrupados(),
        ]);
    }

    public function store(StoreRolRequest $request): RedirectResponse
    {
        $rol = $this->rolService->crear($request->validated());

        return to_route('roles.index')->with('success', "Rol «{$rol->nombre}» creado exitosamente.");
    }

    public function update(UpdateRolRequest $request, Rol $role): RedirectResponse
    {
        if ($role->es_sistema && $request->validated('slug') !== $role->slug) {
            return back()->with('error', 'No se puede cambiar el slug de un rol del sistema.');
        }

        $this->rolService->actualizar($role, $request->validated());

        return to_route('roles.index')->with('success', "Rol «{$role->nombre}» actualizado exitosamente.");
    }

    public function destroy(Rol $role): RedirectResponse
    {
        if ($role->es_sistema) {
            return back()->with('error', 'No se puede eliminar un rol del sistema.');
        }

        $this->rolService->eliminar($role);

        return to_route('roles.index')->with('success', 'Rol eliminado exitosamente.');
    }
}
