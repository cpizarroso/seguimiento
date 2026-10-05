<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use App\Models\UserPuesto;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $rolId = Rol::where('slug', 'user')->value('id');

        User::factory(5)->create()->each(function ($user) use ($rolId) {
            UserPuesto::create([
                'user_id' => $user->id,
                'puesto_id' => Puesto::inRandomOrder()->value('id'),
                'fecha_inicio' => now()->toDateString(),
            ]);

            if ($rolId !== null) {
                $user->roles()->syncWithoutDetaching([$rolId]);
            }
        });
    }
}
