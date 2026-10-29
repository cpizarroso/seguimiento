<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Tablas que se vacían antes de sembrar. Solo se truncan las que existan,
     * para que el seeder no falle si el esquema tiene drift.
     *
     * @var list<string>
     */
    private const TABLAS_A_LIMPIAR = [
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
        'permiso_user',
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

    private function limpiarTablas(): void
    {
        $tablas = array_values(array_filter(
            self::TABLAS_A_LIMPIAR,
            fn (string $tabla): bool => Schema::hasTable($tabla),
        ));

        if ($tablas === []) {
            return;
        }

        $esMySql = DB::connection()->getDriverName() === 'mysql';

        if ($esMySql) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }

        try {
            foreach ($tablas as $tabla) {
                DB::table($tabla)->truncate();
            }
        } finally {
            if ($esMySql) {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }
        }
    }

    /**
     * Siembra la base operativa: roles y permisos, configuración, áreas con sus
     * puestos y los usuarios institucionales. No crea trámites, derivaciones ni
     * actuaciones: esos datos se generan con TramiteSeeder / ActuacionSeeder.
     */
    public function run(): void
    {
        $this->limpiarTablas();

        $this->call([
            RolesYPermisosSeeder::class,
            PermisosBackupsSeeder::class,
            PermisosTramitacionSeeder::class,
            ConfiguracionSeeder::class,
            AreaSeeder::class,
            UsuarioSeeder::class,
        ]);
    }
}
