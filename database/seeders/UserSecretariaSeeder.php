<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use App\Models\UserPuesto;
use Illuminate\Database\Seeder;

class UserSecretariaSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'erodriguez@'.config('app.user_domain');

        $ericka = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Erika Rodriguez',
                'password' => bcrypt('password'),
                'role' => 'secretaria',
            ]
        );

        $puestoId = $this->resolverPuestoSecretaria();

        if ($puestoId === null) {
            return;
        }

        UserPuesto::firstOrCreate(
            [
                'user_id' => $ericka->id,
                'puesto_id' => $puestoId,
                'fecha_inicio' => now()->toDateString(),
            ]
        );

        $rolId = Rol::where('slug', $ericka->role)->value('id');

        if ($rolId !== null) {
            $ericka->roles()->sync([$rolId]);
        }
    }

    private function resolverPuestoSecretaria(): ?int
    {
        $puestoDla = Puesto::where('nombre', 'Secretaria')
            ->whereHas('area', fn ($q) => $q->where('sigla', 'DLA'))
            ->value('id');

        if ($puestoDla !== null) {
            return $puestoDla;
        }

        $cualquiera = Puesto::where('nombre', 'Secretaria')->orderBy('id')->value('id');

        if ($cualquiera !== null) {
            return $cualquiera;
        }

        return Puesto::orderBy('id')->value('id');
    }
}
