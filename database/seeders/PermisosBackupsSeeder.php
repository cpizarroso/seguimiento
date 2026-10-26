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
class PermisosBackupsSeeder extends Seeder
{
    public function run(): void
    {
        $modulo = Modulo::firstOrCreate(
            ['slug' => 'backups'],
            ['nombre' => 'Backups', 'descripcion' => 'Gestión de copias de seguridad', 'orden' => 9],
        );

        $acciones = [
            'consulta' => 'Consulta',
            'creacion' => 'Creación',
            'edicion' => 'Edición',
            'baja' => 'Baja',
            'descarga' => 'Descarga',
            'restauracion' => 'Restauración',
        ];

        foreach ($acciones as $slug => $nombre) {
            Accion::firstOrCreate(['slug' => $slug], ['nombre' => $nombre]);
        }

        $accionIds = Accion::whereIn('slug', [
            'consulta', 'creacion', 'edicion', 'baja', 'descarga', 'restauracion',
        ])->pluck('id', 'slug');

        $permisoIds = [];

        foreach ($accionIds as $accionId) {
            $permisoIds[] = Permiso::firstOrCreate([
                'modulo_id' => $modulo->id,
                'accion_id' => $accionId,
            ])->id;
        }

        Rol::where('slug', 'admin')
            ->first()
            ?->permisos()
            ->syncWithoutDetaching($permisoIds);
    }
}
