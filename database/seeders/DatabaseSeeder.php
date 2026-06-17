<?php

namespace Database\Seeders;

use App\Models\Puesto;
use App\Models\Tramite;
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

        $ericka = User::factory()->create([
            'name' => 'Erika Rodriguez',
            'email' => 'erodriguez@' . config('app.user_domain'),
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);

        $puestoId = Puesto::value('id');
        $year = now()->year;

        foreach (range(1, 10) as $i) {
            Tramite::create([
                'numero_tramite' => $i,
                'year' => $year,
                'fecha' => now()->subDays(10 - $i)->format('Y-m-d'),
                'descripcion' => "Trámite {$i} - Erika Rodríguez",
                'numero_diamante' => "{$year}-" . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'estado' => 'iniciado',
                'puesto_id' => $puestoId,
                'creado_por' => $ericka->id,
                'derivado_a' => null,
                'ultima_respuesta' => null,
            ]);
        }
    }
}
