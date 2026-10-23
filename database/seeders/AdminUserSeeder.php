<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admins = [
            [
                'name' => 'Admin',
                'email' => 'admin@seguimiento.gob.bo',
                'role' => 'admin',
                'persona' => ['nombres' => 'Carlos', 'apellidos' => 'Mendoza López', 'ci' => '1000001', 'correo' => 'cmendoza@ejemplo.gob.bo'],
                'area' => 'DLA',
                'puesto' => 'JEFE',
            ],
            [
                'name' => 'Alfredo Montoya Calderón',
                'email' => 'amontoya@seguimiento.gob.bo',
                'role' => 'admin',
                'persona' => ['nombres' => 'Alfredo', 'apellidos' => 'Montoya Calderón', 'ci' => '2000001', 'correo' => 'amontoya@seguimiento.gob.bo'],
                'area' => 'SEMPLA',
                'puesto' => 'JEFE',
            ],
            [
                'name' => 'Cristian Marcelo Pizarroso Peredo',
                'email' => 'cpizarroso@seguimiento.gob.bo',
                'role' => 'admin',
                'persona' => ['nombres' => 'Cristian Marcelo', 'apellidos' => 'Pizarroso Peredo', 'ci' => '2000002', 'correo' => 'cpizarroso@seguimiento.gob.bo'],
                'area' => 'SEMPLA',
                'puesto' => 'PROFESIONAL',
            ],
        ];

        foreach ($admins as $data) {
            $persona = $this->resolverPersona($data['persona'], $data['area'], $data['puesto']);

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('password'),
                    'role' => $data['role'],
                    'persona_id' => $persona->id,
                ]
            );

            $this->asignarRol($user, 'admin');
        }
    }

    private function resolverPersona(array $data, string $areaCodigo, string $puestoNombre): Persona
    {
        $persona = Persona::updateOrCreate(
            ['ci' => $data['ci']],
            [
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'correo' => $data['correo'],
                'telefono' => null,
                'direccion' => null,
                'activo' => true,
            ]
        );

        if ($persona->puestoActivo()->exists()) {
            return $persona;
        }

        $areaId = Area::where('codigo', $areaCodigo)->value('id');
        $puesto = Puesto::where('area_id', $areaId)->where('nombre', $puestoNombre)->first();

        if ($puesto) {
            PersonaPuesto::create([
                'persona_id' => $persona->id,
                'puesto_id' => $puesto->id,
                'fecha_inicio' => now()->toDateString(),
                'fecha_fin' => null,
            ]);
        }

        return $persona;
    }

    private function asignarRol(User $user, string $slug): void
    {
        $rolId = Rol::where('slug', $slug)->value('id');

        if ($rolId !== null) {
            $user->roles()->syncWithoutDetaching([$rolId]);
        }
    }
}
