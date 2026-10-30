<?php

use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use App\Services\RolService;
use Database\Seeders\PermisosBackupsSeeder;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->seed(PermisosBackupsSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->firstOrFail()->id]);
});

function permisoDe(string $modulo, string $accion): Permiso
{
    return Permiso::query()
        ->whereHas('modulo', fn ($query) => $query->where('slug', $modulo))
        ->whereHas('accion', fn ($query) => $query->where('slug', $accion))
        ->sole();
}

/**
 * @param  array<int, array{0: string, 1: string}>  $pares
 */
function crearRolConPermisos(string $slug, array $pares): Rol
{
    $rol = Rol::create([
        'nombre' => "Rol {$slug}",
        'slug' => $slug,
        'descripcion' => null,
        'es_sistema' => false,
    ]);

    $rol->permisos()->sync(array_map(
        fn (array $par) => permisoDe($par[0], $par[1])->id,
        $pares,
    ));

    return $rol;
}

/**
 * @param  array<int, array{0: string, 1: string}>  $pares
 */
function crearUsuarioConPermisos(array $pares): User
{
    $usuario = User::factory()->create();
    $usuario->roles()->sync([crearRolConPermisos('rol-'.uniqid(), $pares)->id]);

    return $usuario;
}

it('el indice exige el permiso de consulta del modulo', function () {
    $usuario = crearUsuarioConPermisos([['usuarios', 'consulta']]);

    $this->actingAs($usuario)
        ->get(route('roles.index'))
        ->assertForbidden();
});

it('el indice entrega roles y permisos agrupados por orden de modulo', function () {
    $this->actingAs($this->admin)
        ->get(route('roles.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Roles/Index')
            ->has('roles.data')
            ->has('permisos_agrupados'),
        );

    $grupos = app(RolService::class)->permisosAgrupados();

    expect(array_keys($grupos))->toBe([
        'Dashboard',
        'Trámites',
        'Personas',
        'Áreas y Puestos',
        'Reporte',
        'Configuración',
        'Usuarios',
        'Roles',
        'Backups',
    ]);
});

it('no permite crear roles sin el permiso de creacion', function () {
    $usuario = crearUsuarioConPermisos([['roles', 'consulta']]);

    $this->actingAs($usuario)
        ->post(route('roles.store'), [
            'nombre' => 'Supervisor',
            'slug' => 'supervisor',
            'permiso_ids' => [],
        ])
        ->assertForbidden();
});

it('crea un rol con sus permisos', function () {
    $usuario = crearUsuarioConPermisos([['roles', 'consulta'], ['roles', 'creacion']]);
    $permisos = [permisoDe('roles', 'consulta')->id, permisoDe('tramites', 'consulta')->id];

    $this->actingAs($usuario)
        ->post(route('roles.store'), [
            'nombre' => 'Supervisor',
            'slug' => 'supervisor',
            'descripcion' => 'Solo consulta',
            'permiso_ids' => $permisos,
        ])
        ->assertRedirect(route('roles.index'))
        ->assertSessionHas('success');

    $rol = Rol::where('slug', 'supervisor')->firstOrFail();

    expect($rol->es_sistema)->toBeFalse()
        ->and($rol->permisos()->pluck('permisos.id')->sort()->values()->all())
        ->toBe(collect($permisos)->sort()->values()->all());
});

it('valida el formato y la unicidad del slug al crear', function () {
    $this->actingAs($this->admin)
        ->post(route('roles.store'), [
            'nombre' => 'Duplicado',
            'slug' => 'admin',
        ])
        ->assertSessionHasErrors('slug');

    $this->actingAs($this->admin)
        ->post(route('roles.store'), [
            'nombre' => 'Con espacios',
            'slug' => 'con espacios',
        ])
        ->assertSessionHasErrors('slug');
});

it('actualiza un rol conservando su slug', function () {
    $usuario = crearUsuarioConPermisos([['roles', 'consulta'], ['roles', 'edicion']]);
    $rol = crearRolConPermisos('supervisor', [['roles', 'consulta']]);

    $this->actingAs($usuario)
        ->put(route('roles.update', $rol), [
            'nombre' => 'Supervisión',
            'slug' => 'supervisor',
            'descripcion' => 'Actualizado',
            'permiso_ids' => [permisoDe('tramites', 'consulta')->id],
        ])
        ->assertRedirect(route('roles.index'))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $rol->refresh();

    expect($rol->nombre)->toBe('Supervisión')
        ->and($rol->descripcion)->toBe('Actualizado')
        ->and($rol->permisos()->pluck('permisos.id')->all())
        ->toBe([permisoDe('tramites', 'consulta')->id]);
});

it('no permite cambiar el slug de un rol del sistema', function () {
    $admin = Rol::where('slug', 'admin')->firstOrFail();

    $this->actingAs($this->admin)
        ->put(route('roles.update', $admin), [
            'nombre' => 'Administrador',
            'slug' => 'super-admin',
        ])
        ->assertSessionHas('error');

    expect($admin->fresh()->slug)->toBe('admin');
});

it('no permite repetir el slug de otro rol al editar', function () {
    $rol = crearRolConPermisos('supervisor', [['roles', 'consulta']]);

    $this->actingAs($this->admin)
        ->put(route('roles.update', $rol), [
            'nombre' => 'Supervisor',
            'slug' => 'admin',
        ])
        ->assertSessionHasErrors('slug');
});

it('no elimina roles del sistema', function () {
    $admin = Rol::where('slug', 'admin')->firstOrFail();

    $this->actingAs($this->admin)
        ->delete(route('roles.destroy', $admin))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('roles', ['id' => $admin->id]);
});

it('elimina roles personalizados solo con el permiso de baja', function () {
    $rol = crearRolConPermisos('temporal', [['roles', 'consulta']]);
    $soloConsulta = crearUsuarioConPermisos([['roles', 'consulta']]);

    $this->actingAs($soloConsulta)
        ->delete(route('roles.destroy', $rol))
        ->assertForbidden();

    $conBaja = crearUsuarioConPermisos([['roles', 'consulta'], ['roles', 'baja']]);

    $this->actingAs($conBaja)
        ->delete(route('roles.destroy', $rol))
        ->assertRedirect(route('roles.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('roles', ['id' => $rol->id]);
});

it('expone el total de usuarios asignados al rol en el indice', function () {
    $rol = crearRolConPermisos('supervisor', [['roles', 'consulta']]);
    User::factory()->count(2)->create()->each(fn (User $user) => $user->roles()->sync([$rol->id]));

    $roles = app(RolService::class)->listar();
    $supervisor = $roles->firstWhere('slug', 'supervisor');

    expect($supervisor->usuarios_count)->toBe(2);
});
