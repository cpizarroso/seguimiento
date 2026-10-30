<?php

namespace App\Services;

use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RolService
{
    /**
     * Roles con sus permisos y el total de usuarios asignados.
     *
     * @return Collection<int, Rol>
     */
    public function listar(): Collection
    {
        return Rol::query()
            ->with('permisos.modulo', 'permisos.accion')
            ->withCount('usuarios')
            ->orderBy('nombre')
            ->get();
    }

    /**
     * Catálogo de permisos agrupado por nombre de módulo, respetando el orden
     * configurado en `modulos.orden` y el orden de alta de cada acción.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function permisosAgrupados(): array
    {
        return Permiso::query()
            ->with(['modulo', 'accion'])
            ->get()
            ->sortBy(fn (Permiso $permiso) => sprintf(
                '%03d|%s|%03d',
                (int) ($permiso->modulo->orden ?? 0),
                $permiso->modulo->slug,
                (int) $permiso->accion->id,
            ))
            ->groupBy(fn (Permiso $permiso) => $permiso->modulo->nombre)
            ->map(fn ($permisos) => $permisos->map(fn (Permiso $permiso) => [
                'id' => $permiso->id,
                'modulo' => $permiso->modulo->slug,
                'modulo_nombre' => $permiso->modulo->nombre,
                'accion' => $permiso->accion->slug,
                'accion_nombre' => $permiso->accion->nombre,
            ])->values()->all())
            ->all();
    }

    /**
     * @param  array{nombre: string, slug: string, descripcion?: string|null, permiso_ids?: array<int, int>}  $data
     */
    public function crear(array $data): Rol
    {
        return DB::transaction(function () use ($data) {
            $rol = Rol::create([
                'nombre' => $data['nombre'],
                'slug' => $data['slug'],
                'descripcion' => $data['descripcion'] ?? null,
                'es_sistema' => false,
            ]);

            $rol->permisos()->sync($data['permiso_ids'] ?? []);

            return $rol;
        });
    }

    /**
     * @param  array{nombre: string, slug: string, descripcion?: string|null, permiso_ids?: array<int, int>}  $data
     */
    public function actualizar(Rol $rol, array $data): Rol
    {
        return DB::transaction(function () use ($rol, $data) {
            $rol->update([
                'nombre' => $data['nombre'],
                'slug' => $data['slug'],
                'descripcion' => $data['descripcion'] ?? null,
            ]);

            $rol->permisos()->sync($data['permiso_ids'] ?? []);

            return $rol;
        });
    }

    public function eliminar(Rol $rol): void
    {
        $rol->delete();
    }
}
