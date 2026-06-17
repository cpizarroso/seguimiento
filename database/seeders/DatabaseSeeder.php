<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    private function limpiarTablas(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tablas = [
            'derivaciones',
            'tramites',
            'contador_tramites',
            'funcionario_puesto',
            'users',
            'funcionarios',
            'puestos',
            'personal_access_tokens',
            'sessions',
            'cache',
            'cache_locks',
            'job_batches',
            'jobs',
            'failed_jobs',
            'password_reset_tokens',
        ];

        foreach ($tablas as $tabla) {
            DB::table($tabla)->truncate();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    public function run(): void
    {
        $this->limpiarTablas();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@' . config('app.user_domain'),
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Alfredo Montoya Calderón',
            'email' => 'amontoya@' . config('app.user_domain'),
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Cristian Marcelo Pizarroso Peredo',
            'email' => 'cpizarroso@' . config('app.user_domain'),
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->call([
            PuestoSeeder::class,
            FuncionarioSeeder::class,
            UserSeeder::class,
            TramiteSeeder::class,
        ]);
    }
}
