<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Funcionario;
use Illuminate\Database\Seeder;

class VinculacionSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@seguimiento.gob.bo')->first();
        $carlos = Funcionario::where('nombre', 'Carlos Mendoza')->first();

        if ($admin && $carlos) {
            $admin->update(['funcionario_id' => $carlos->id]);
            $this->command->info("Admin vinculado a funcionario: {$carlos->nombre}");
        }

        $funcionarios = Funcionario::all();

        foreach ($funcionarios as $funcionario) {
            $userExists = User::where('email', $funcionario->email)->exists();

            if (!$userExists) {
                $user = User::create([
                    'name' => $funcionario->nombre,
                    'email' => $funcionario->email,
                    'password' => bcrypt('funcionario123'),
                    'funcionario_id' => $funcionario->id,
                ]);

                $this->command->info("Usuario creado: {$user->email} / funcionario123");
            }
        }

        $totalUsers = User::count();
        $vinculados = User::whereNotNull('funcionario_id')->count();
        $this->command->info("Total usuarios: {$totalUsers}, vinculados: {$vinculados}");
    }
}
