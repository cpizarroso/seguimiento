<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\ContadorTramite;
use App\Models\Puesto;
use App\Models\Tramite;
use App\Models\User;
use App\Models\UserPuesto;
use Database\Factories\DerivacionFactory;
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

    private function asignarPuesto(User $user): void
    {
        UserPuesto::create([
            'user_id' => $user->id,
            'puesto_id' => Puesto::inRandomOrder()->value('id'),
            'fecha_inicio' => now()->toDateString(),
        ]);
    }

    public function run(): void
    {
        $this->limpiarTablas();

        $this->call(AreaSeeder::class);

        $admin1 = User::create([
            'name' => 'Admin',
            'email' => 'admin@seguimiento.gob.bo',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->asignarPuesto($admin1);

        $admin2 = User::create([
            'name' => 'Alfredo Montoya Calderón',
            'email' => 'amontoya@seguimiento.gob.bo',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->asignarPuesto($admin2);

        $admin3 = User::create([
            'name' => 'Cristian Marcelo Pizarroso Peredo',
            'email' => 'cpizarroso@seguimiento.gob.bo',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        $this->asignarPuesto($admin3);

        $this->call(FuncionarioSeeder::class);

        $this->call(UserSeeder::class);

        $ericka = User::factory()->create([
            'name' => 'Erika Rodriguez',
            'email' => 'erodriguez@' . config('app.user_domain'),
            'password' => bcrypt('password'),
            'role' => 'user',
        ]);
        $this->asignarPuesto($ericka);

        $areaId = Area::where('nombre', 'Administrativa')->value('id') ?? 1;
        $ultimoNumero = Tramite::where('area_id', $areaId)->max('numero_tramite') ?? 0;
        $year = now()->year;

        foreach (range(1, 10) as $i) {
            $tramite = Tramite::create([
                'numero_tramite' => $ultimoNumero + $i,
                'year' => $year,
                'fecha' => now()->subDays(10 - $i),
                'descripcion' => "Trámite {$i} - Erika Rodríguez",
                'numero_diamante' => "{$year}-" . str_pad((string) ($ultimoNumero + $i), 4, '0', STR_PAD_LEFT),
                'estado' => 'iniciado',
                'area_id' => $areaId,
                'creado_por' => $ericka->id,
                'derivado_a' => null,
                'ultima_respuesta' => null,
            ]);

            DerivacionFactory::new()->crearCadena($tramite, random_int(3, 8));
        }

        $this->call(TramiteSeeder::class);

        $this->sincronizarContadores();
    }

    private function sincronizarContadores(): void
    {
        $grupos = Tramite::selectRaw('area_id, year, MAX(numero_tramite) as max_num')
            ->groupBy('area_id', 'year')
            ->get();

        foreach ($grupos as $g) {
            ContadorTramite::updateOrCreate(
                ['area_id' => $g->area_id, 'year' => $g->year],
                ['ultimo_numero' => $g->max_num],
            );
        }
    }
}
