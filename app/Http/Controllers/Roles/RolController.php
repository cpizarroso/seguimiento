<?php

namespace App\Http\Controllers\Roles;

use App\Http\Controllers\Controller;
use App\Http\Requests\Roles\StoreRolRequest;
use App\Http\Requests\Roles\UpdateRolRequest;
use App\Http\Resources\RolResource;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RolController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Roles/Index', [
            'roles' => RolResource::collection(Rol::with('permisos.modulo', 'permisos.accion')->get()),
            'permisos_agrupados' => $this->permisosAgrupados(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Roles/Create', [
            'permisos_agrupados' => $this->permisosAgrupados(),
        ]);
    }

    private function permisosAgrupados(): array
    {
        return Permiso::with('modulo', 'accion')->get()->groupBy(fn ($p) => $p->modulo->nombre)
            ->map(fn ($items) => $items->map(fn ($p) => [
                'id' => $p->id,
                'modulo' => $p->modulo->slug,
                'modulo_nombre' => $p->modulo->nombre,
                'accion' => $p->accion->slug,
                'accion_nombre' => $p->accion->nombre,
            ])->values()->toArray())
            ->toArray();
    }

    public function store(StoreRolRequest $request): RedirectResponse
    {
        $rol = Rol::create([
            'nombre' => $request->nombre,
            'slug' => $request->slug,
            'descripcion' => $request->descripcion,
        ]);

        $rol->permisos()->sync($request->permiso_ids ?? []);

        return to_route('roles.index')->with('success', "Rol «{$rol->nombre}» creado exitosamente.");
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
            'permisos_agrupados' => $this->permisosAgrupados(),
        ]);
    }

    public function update(UpdateRolRequest $request, Rol $role): RedirectResponse
    {
        if ($role->es_sistema && $request->slug !== $role->slug) {
            return back()->with('error', 'No se puede cambiar el slug de un rol del sistema.');
        }

        $role->update([
            'nombre' => $request->nombre,
            'slug' => $request->slug,
            'descripcion' => $request->descripcion,
        ]);

        $role->permisos()->sync($request->permiso_ids ?? []);

        return to_route('roles.index')->with('success', "Rol «{$role->nombre}» actualizado exitosamente.");
    }

    public function destroy(Rol $role): RedirectResponse
    {
        if ($role->es_sistema) {
            return back()->with('error', 'No se puede eliminar un rol del sistema.');
        }

        $role->delete();

        return to_route('roles.index')->with('success', 'Rol eliminado exitosamente.');
    }
}
