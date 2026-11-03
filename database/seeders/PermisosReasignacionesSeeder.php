<?php

namespace Database\Seeders;

use App\Models\Accion;
use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

/**
 * Seeder idempotente: puede ejecutarse en producción sin migrate:fresh y
 * tantas veces como se quiera.
 */
class PermisosReasignacionesSeeder extends Seeder
{
    public function run(): void
    {
        $modulo = Modulo::firstOrCreate(
            ['slug' => 'reasignaciones'],
            [
                'nombre' => 'Reasignaciones',
                'descripcion' => 'Solicitudes de reasignación de trámites',
                'orden' => 10,
            ],
        );

        $acciones = [
            'consulta' => 'Consulta',
            'creacion' => 'Creación',
            'resolucion' => 'Resolución',
        ];

        foreach ($acciones as $slug => $nombre) {
            Accion::firstOrCreate(['slug' => $slug], ['nombre' => $nombre]);
        }

        $accionIds = Accion::whereIn('slug', array_keys($acciones))->pluck('id', 'slug');

        $permisoIds = [];

        foreach ($accionIds as $slug => $accionId) {
            $permisoIds[$slug] = Permiso::firstOrCreate([
                'modulo_id' => $modulo->id,
                'accion_id' => $accionId,
            ])->id;
        }

        // Todos los roles pueden consultar y solicitar reasignaciones.
        Rol::all()->each(function (Rol $rol) use ($permisoIds): void {
            $rol->permisos()->syncWithoutDetaching([
                $permisoIds['consulta'],
                $permisoIds['creacion'],
            ]);
        });

        // Solo admin y jefe resuelven las solicitudes.
        Rol::whereIn('slug', ['admin', 'jefe'])
            ->get()
            ->each(function (Rol $rol) use ($permisoIds): void {
                $rol->permisos()->syncWithoutDetaching([$permisoIds['resolucion']]);
            });
    }
}
