<?php

use App\Models\Accion;
use App\Models\Permiso;
use App\Models\Rol;
use Database\Seeders\PermisosCreacionTramitesSeeder;
use Database\Seeders\RolesYPermisosSeeder;

it('es idempotente y concede creacion a todos los roles', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->seed(PermisosCreacionTramitesSeeder::class);
    $this->seed(PermisosCreacionTramitesSeeder::class);

    $acciones = Accion::where('slug', 'creacion')->count();
    $permisos = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', 'tramites'))
        ->whereHas('accion', fn ($q) => $q->where('slug', 'creacion'))
        ->get();

    expect($acciones)->toBe(1)
        ->and($permisos)->toHaveCount(1);

    $permisoId = $permisos->first()->id;

    foreach (Rol::all() as $rol) {
        expect($rol->permisos()->where('permisos.id', $permisoId)->exists())->toBeTrue();
    }
});

it('recrea la accion y el permiso si faltan', function () {
    $this->seed(RolesYPermisosSeeder::class);

    Permiso::whereHas('accion', fn ($q) => $q->where('slug', 'creacion'))->delete();
    Accion::where('slug', 'creacion')->delete();

    $this->seed(PermisosCreacionTramitesSeeder::class);

    expect(Accion::where('slug', 'creacion')->exists())->toBeTrue()
        ->and(Permiso::whereHas('accion', fn ($q) => $q->where('slug', 'creacion'))->exists())->toBeTrue();
});

it('concede creacion a los roles creados despues', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->seed(PermisosCreacionTramitesSeeder::class);

    $nuevo = Rol::create([
        'nombre' => 'Operador',
        'slug' => 'operador',
        'descripcion' => 'Rol posterior al seeder',
        'es_sistema' => false,
    ]);

    $this->seed(PermisosCreacionTramitesSeeder::class);

    $permisoId = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', 'tramites'))
        ->whereHas('accion', fn ($q) => $q->where('slug', 'creacion'))
        ->value('id');

    expect($nuevo->permisos()->where('permisos.id', $permisoId)->exists())->toBeTrue();
});
