<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $rolId = Rol::where('slug', 'user')->value('id');
        $dlaId = Area::where('codigo', 'DLA')->value('id');

        $puestos = Puesto::where('area_id', '!=', $dlaId)
            ->where('activo', true)
            ->inRandomOrder()
            ->take(5)
            ->get();

        foreach ($puestos as $puesto) {
            $persona = Persona::factory()->create();

            PersonaPuesto::create([
                'persona_id' => $persona->id,
                'puesto_id' => $puesto->id,
                'fecha_inicio' => now()->toDateString(),
                'fecha_fin' => null,
            ]);

            $user = User::factory()->create([
                'name' => $persona->nombre_completo,
                'email' => $persona->correo,
                'persona_id' => $persona->id,
            ]);

            if ($rolId !== null) {
                $user->roles()->syncWithoutDetaching([$rolId]);
            }
        }
    }
}
