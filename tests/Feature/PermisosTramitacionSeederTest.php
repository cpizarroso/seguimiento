<?php

use App\Models\Accion;
use App\Models\Permiso;
use App\Models\Rol;
use Database\Seeders\PermisosTramitacionSeeder;
use Database\Seeders\RolesYPermisosSeeder;

it('es idempotente y concede tramitacion a todos los roles', function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->seed(PermisosTramitacionSeeder::class);
    $this->seed(PermisosTramitacionSeeder::class);

    $acciones = Accion::where('slug', 'tramitacion')->count();
    $permisos = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', 'tramites'))
        ->whereHas('accion', fn ($q) => $q->where('slug', 'tramitacion'))
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

    Permiso::whereHas('accion', fn ($q) => $q->where('slug', 'tramitacion'))->delete();
    Accion::where('slug', 'tramitacion')->delete();

    $this->seed(PermisosTramitacionSeeder::class);

    expect(Accion::where('slug', 'tramitacion')->exists())->toBeTrue()
        ->and(Permiso::whereHas('accion', fn ($q) => $q->where('slug', 'tramitacion'))->exists())->toBeTrue();
});
