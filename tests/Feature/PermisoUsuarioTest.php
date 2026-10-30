<?php

use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
});

function permisoPorSlug(string $modulo, string $accion): int
{
    return (int) Permiso::query()
        ->whereHas('modulo', fn ($q) => $q->where('slug', $modulo))
        ->whereHas('accion', fn ($q) => $q->where('slug', $accion))
        ->value('id');
}

function usuarioConRol(string $slug): User
{
    $user = User::factory()->create();
    $user->roles()->sync([Rol::where('slug', $slug)->firstOrFail()->id]);

    return $user->fresh();
}

it('hereda el permiso tramitacion del rol cuando no hay overrides', function () {
    $user = usuarioConRol('user');

    expect($user->hasPermission('tramites', 'tramitacion'))->toBeTrue()
        ->and($user->permisos_slug)->toContain('tramites.tramitacion');
});

it('un override de denegacion gana incluso sobre el rol admin', function () {
    $admin = usuarioConRol('admin');
    $admin->permisosDirectos()->attach(permisoPorSlug('tramites', 'tramitacion'), ['permitido' => false]);

    $admin = $admin->fresh();

    expect($admin->hasPermission('tramites', 'tramitacion'))->toBeFalse()
        ->and($admin->permisos_slug)->not->toContain('tramites.tramitacion')
        ->and($admin->hasPermission('tramites', 'consulta'))->toBeTrue();
});

it('un override de concesion agrega un permiso que el rol no aporta', function () {
    $user = usuarioConRol('user');
    $user->permisosDirectos()->attach(permisoPorSlug('usuarios', 'edicion'), ['permitido' => true]);

    $user = $user->fresh();

    expect($user->hasPermission('usuarios', 'edicion'))->toBeTrue()
        ->and($user->permisos_slug)->toContain('usuarios.edicion');
});

it('expone los overrides como mapa modulo.accion', function () {
    $user = usuarioConRol('user');
    $user->permisosDirectos()->attach(permisoPorSlug('tramites', 'tramitacion'), ['permitido' => false]);
    $user->permisosDirectos()->attach(permisoPorSlug('usuarios', 'edicion'), ['permitido' => true]);

    expect($user->fresh()->overridesPermisos())->toMatchArray([
        'tramites.tramitacion' => false,
        'usuarios.edicion' => true,
    ]);
});
