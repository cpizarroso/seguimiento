<?php

use App\Backups\Contrato\Dumper;
use App\Backups\FakeDumper;
use App\Models\Area;
use App\Models\Backup;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use App\Services\BackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature', 'Unit');

function crearArea(string $codigo, ?string $nombre = null, ?Area $padre = null): Area
{
    return Area::factory()->create([
        'nombre' => $nombre ?? 'Área '.$codigo,
        'codigo' => $codigo,
        'area_padre_id' => $padre?->id,
    ]);
}

function crearPersonaConPuesto(?Area $area = null, ?Puesto $puesto = null, array $personaAttrs = []): Persona
{
    $area ??= Area::factory()->create();

    $puesto ??= Puesto::factory()->create([
        'area_id' => $area->id,
        'activo' => true,
    ]);

    $persona = Persona::factory()->create($personaAttrs);

    PersonaPuesto::create([
        'persona_id' => $persona->id,
        'puesto_id' => $puesto->id,
        'fecha_inicio' => now()->toDateString(),
        'fecha_fin' => null,
    ]);

    return $persona->fresh();
}

function crearUsuarioConPuesto(?Area $area = null, array $userAttrs = [], array $personaAttrs = []): array
{
    $persona = crearPersonaConPuesto($area, null, $personaAttrs);

    $user = User::factory()->create([
        'persona_id' => $persona->id,
        ...$userAttrs,
    ]);

    return [$user, $persona, $persona->puestoActivo->puesto->area];
}

function crearAdminBackups(): User
{
    $admin = User::factory()->create();

    $admin->roles()->attach(Rol::create([
        'nombre' => 'Administrador',
        'slug' => 'admin',
        'descripcion' => 'Acceso total',
        'es_sistema' => true,
    ]));

    return $admin->fresh();
}

function usarDumperFalso(): FakeDumper
{
    $fake = new FakeDumper();

    app()->instance(Dumper::class, $fake);

    return $fake;
}

function prepararAlmacenBackups(): void
{
    Storage::fake((string) config('backups.disk'));
}

function crearBackupDePrueba(string $tipo = Backup::TIPO_MANUAL, ?int $userId = null, bool $protegido = false): Backup
{
    return app(BackupService::class)->crear($tipo, $userId, null, $protegido);
}
