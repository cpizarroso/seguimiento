<?php

use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use App\Services\UserService;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
});

function registrarSesion(User $user, string $id): void
{
    DB::table('sessions')->insert([
        'id' => $id,
        'user_id' => $user->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'phpunit',
        'payload' => '',
        'last_activity' => now()->timestamp,
    ]);
}

function rolSoloConsultaDeUsuarios(): Rol
{
    $consulta = Permiso::query()
        ->whereHas('modulo', fn ($query) => $query->where('slug', 'usuarios'))
        ->whereHas('accion', fn ($query) => $query->where('slug', 'consulta'))
        ->sole();

    $rol = Rol::create([
        'nombre' => 'Consulta de usuarios',
        'slug' => 'usuarios-consulta',
        'descripcion' => 'Solo lectura',
        'es_sistema' => false,
    ]);
    $rol->permisos()->attach($consulta->id);

    return $rol;
}

it('desactiva al usuario, cierra sus sesiones y revoca sus tokens', function () {
    [$destino] = crearUsuarioConPuesto();
    $destino->createToken('api');
    registrarSesion($destino, 'sesion-destino');

    $this->actingAs($this->admin)
        ->from(route('users.index'))
        ->put(route('users.estado.update', $destino), ['activo' => false])
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    expect($destino->fresh()->activo)->toBeFalse()
        ->and($destino->tokens()->count())->toBe(0)
        ->and(DB::table('sessions')->where('user_id', $destino->id)->count())->toBe(0);
});

it('vuelve a activar al usuario sin tocar sus sesiones', function () {
    [$destino] = crearUsuarioConPuesto(null, ['activo' => false]);

    $this->actingAs($this->admin)
        ->put(route('users.estado.update', $destino), ['activo' => true])
        ->assertSessionHas('success');

    expect($destino->fresh()->activo)->toBeTrue();
});

it('impide que el administrador desactive su propia cuenta', function () {
    $this->actingAs($this->admin)
        ->put(route('users.estado.update', $this->admin), ['activo' => false])
        ->assertSessionHasErrors('activo');

    expect($this->admin->fresh()->activo)->toBeTrue();
});

it('rechaza el cambio de estado sin permiso de edición de usuarios', function () {
    [$destino] = crearUsuarioConPuesto();

    $operador = User::factory()->create();
    $operador->roles()->sync([rolSoloConsultaDeUsuarios()->id]);

    $this->actingAs($operador)
        ->put(route('users.estado.update', $destino), ['activo' => false])
        ->assertForbidden();

    expect($destino->fresh()->activo)->toBeTrue();
});

it('exige el campo activo', function () {
    [$destino] = crearUsuarioConPuesto();

    $this->actingAs($this->admin)
        ->put(route('users.estado.update', $destino), [])
        ->assertSessionHasErrors('activo');
});

it('no permite iniciar sesión a un usuario inactivo', function () {
    User::factory()->create([
        'username' => 'inactivo',
        'password' => 'secreto123',
        'activo' => false,
    ]);

    $this->post('/login', [
        'login' => 'inactivo',
        'password' => 'secreto123',
    ])->assertSessionHasErrors([
        'login' => 'Tu cuenta está inactiva. Contacta al administrador.',
    ]);

    $this->assertGuest();
});

it('conserva la sesión indicada al cerrar las demás', function () {
    [$usuario] = crearUsuarioConPuesto();
    registrarSesion($usuario, 'sesion-actual');
    registrarSesion($usuario, 'sesion-antigua');

    app(UserService::class)->cerrarSesiones($usuario, 'sesion-actual');

    $restantes = DB::table('sessions')->where('user_id', $usuario->id)->pluck('id')->all();

    expect($restantes)->toBe(['sesion-actual']);
});
