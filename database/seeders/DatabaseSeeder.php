<?php

namespace Database\Seeders;

use App\Models\ContadorTramite;
use App\Models\Rol;
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
            'backup_eventos',
            'backups',
            'configuraciones',
            'reportes',
            'derivaciones',
            'actuaciones',
            'tramites',
            'contador_tramites',
            'rol_permiso',
            'role_user',
            'area_user',
            'permisos',
            'roles',
            'acciones',
            'modulos',
            'persona_puesto',
            'users',
            'personas',
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

        $this->call(RolesYPermisosSeeder::class);

        $this->call(PermisosBackupsSeeder::class);

        $this->call(ConfiguracionSeeder::class);

        $this->call(AreaSeeder::class);

        $this->call(PersonaSeeder::class);

        $this->call(AdminUserSeeder::class);

        $this->call(UserSeeder::class);

        $this->call(UserSecretariaSeeder::class);

        $this->call(TramiteSeeder::class);

        $this->call(ActuacionSeeder::class);

        $this->sincronizarRoles();

        $this->sincronizarAreasHabilitadas();

        $this->sincronizarContadores();
    }

    private function sincronizarRoles(): void
    {
        $adminRol = Rol::where('slug', 'admin')->first();
        $userRol = Rol::where('slug', 'user')->first();
        $secretariaRol = Rol::where('slug', 'secretaria')->first();
        $jefeRol = Rol::where('slug', 'jefe')->first();

        foreach (User::all() as $u) {
            $rolId = match ($u->role) {
                'admin' => $adminRol?->id,
                'secretaria' => $secretariaRol?->id,
                'jefe' => $jefeRol?->id,
                default => $userRol?->id,
            };
            if ($rolId) {
                $u->roles()->sync([$rolId]);
            }
        }
    }

    private function sincronizarAreasHabilitadas(): void
    {
        User::with('persona.puestoActivo.puesto')->get()->each(function (User $user) {
            $areaId = $user->persona?->puestoActivo?->puesto?->area_id;

            if (! $areaId) {
                return;
            }

            $user->areasHabilitadas()->sync([$areaId => ['predeterminada' => true]]);
        });
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
