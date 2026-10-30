<?php

namespace Database\Seeders;

use App\Models\Accion;
use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

/**
 * Seeder idempotente: garantiza que la acción `creacion` del módulo de trámites
 * exista y la concede a todos los roles. Puede ejecutarse en producción sin
 * migrate:fresh y tantas veces como se quiera.
 */
class PermisosCreacionTramitesSeeder extends Seeder
{
    public function run(): void
    {
        $accion = Accion::firstOrCreate(
            ['slug' => 'creacion'],
            ['nombre' => 'Creación'],
        );

        $modulo = Modulo::firstOrCreate(
            ['slug' => 'tramites'],
            ['nombre' => 'Trámites', 'descripcion' => 'Gestión de trámites', 'orden' => 2],
        );

        $permiso = Permiso::firstOrCreate([
            'modulo_id' => $modulo->id,
            'accion_id' => $accion->id,
        ]);

        Rol::query()
            ->get()
            ->each(fn (Rol $rol) => $rol->permisos()->syncWithoutDetaching([$permiso->id]));
    }
}
