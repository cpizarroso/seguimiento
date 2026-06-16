<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Funcionario;
use Illuminate\Database\Seeder;

class VinculacionSeeder extends Seeder
{
    public function run(): void
    {
        $funcionarios = Funcionario::all();

        foreach ($funcionarios as $funcionario) {
            $userExists = User::where('email', $funcionario->email)->exists();

            if (!$userExists) {
                $user = User::create([
                    'name' => $funcionario->nombre,
                    'email' => $funcionario->email,
                    'password' => bcrypt('funcionario123'),
                    'role' => 'user',
                ]);

                $this->command->info("Usuario creado: {$user->email} / funcionario123");
            }
        }

        $totalUsers = User::count();
        $this->command->info("Total usuarios: {$totalUsers}");
    }
}
