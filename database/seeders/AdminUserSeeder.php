<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use App\Models\UserPuesto;
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
            ],
            [
                'name' => 'Alfredo Montoya Calderón',
                'email' => 'amontoya@seguimiento.gob.bo',
                'role' => 'admin',
            ],
            [
                'name' => 'Cristian Marcelo Pizarroso Peredo',
                'email' => 'cpizarroso@seguimiento.gob.bo',
                'role' => 'admin',
            ],
        ];

        foreach ($admins as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => bcrypt('password'),
                    'role' => $data['role'],
                ]
            );

            $this->asignarPuesto($user);
            $this->asignarRol($user, 'admin');
        }
    }

    private function asignarPuesto(User $user): void
    {
        $puestoId = Puesto::inRandomOrder()->value('id');

        if ($puestoId === null) {
            return;
        }

        UserPuesto::firstOrCreate(
            [
                'user_id' => $user->id,
                'puesto_id' => $puestoId,
                'fecha_inicio' => now()->toDateString(),
            ]
        );
    }

    private function asignarRol(User $user, string $slug): void
    {
        $rolId = Rol::where('slug', $slug)->value('id');

        if ($rolId !== null) {
            $user->roles()->syncWithoutDetaching([$rolId]);
        }
    }
}
