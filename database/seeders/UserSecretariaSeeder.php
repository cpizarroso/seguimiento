<?php

namespace Database\Seeders;

use App\Models\Persona;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSecretariaSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'erodriguez@'.config('app.user_domain');

        $persona = Persona::where('ci', '1234567')->first()
            ?? Persona::where('correo', $email)->first();

        $ericka = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $persona?->nombre_completo ?? 'Erika Rodriguez',
                'password' => bcrypt('password'),
                'role' => 'secretaria',
                'persona_id' => $persona?->id,
            ]
        );

        $rolId = Rol::where('slug', $ericka->role)->value('id');

        if ($rolId !== null) {
            $ericka->roles()->sync([$rolId]);
        }
    }
}
