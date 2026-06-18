<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\User;
use App\Models\UserPuesto;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::factory(5)->create()->each(function ($user) {
            UserPuesto::create([
                'user_id' => $user->id,
                'puesto_id' => Puesto::inRandomOrder()->value('id'),
                'fecha_inicio' => now()->toDateString(),
            ]);
        });
    }
}
