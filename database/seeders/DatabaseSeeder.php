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
            'areas',
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

        $this->call([
            AreaSeeder::class,
            FuncionarioSeeder::class,
            VinculacionSeeder::class,
            TramiteSeeder::class,
        ]);
    }
}
