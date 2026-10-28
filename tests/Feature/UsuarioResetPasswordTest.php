<?php

use App\Models\Permiso;
use App\Models\Reseteo;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
});

it('resetea la contraseña, registra el reseteo y revoca los tokens', function () {
    [$destino] = crearUsuarioConPuesto(null, ['username' => 'destino']);
    $destino->createToken('api');

    expect($destino->tokens()->count())->toBe(1);

    $this->actingAs($this->admin)
        ->from(route('users.index'))
        ->put(route('users.reset-password', $destino), [
            'password' => 'Nueva123!',
            'password_confirmation' => 'Nueva123!',
        ])
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    expect(Hash::check('Nueva123!', $destino->fresh()->password))->toBeTrue()
        ->and($destino->tokens()->count())->toBe(0);

    $reseteo = Reseteo::where('user_id', $destino->id)->sole();

    expect($reseteo->reset_por)->toBe($this->admin->id);
});

it('vuelve a la página desde la que se ejecutó el reseteo', function () {
    [$destino] = crearUsuarioConPuesto();

    $this->actingAs($this->admin)
        ->from(route('users.edit', $destino))
        ->put(route('users.reset-password', $destino), [
            'password' => 'Otra1234',
            'password_confirmation' => 'Otra1234',
        ])
        ->assertRedirect(route('users.edit', $destino));
});

it('cierra las sesiones del usuario al resetear su contraseña', function () {
    [$destino] = crearUsuarioConPuesto();

    DB::table('sessions')->insert([
        'id' => 'sesion-destino',
        'user_id' => $destino->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'phpunit',
        'payload' => '',
        'last_activity' => now()->timestamp,
    ]);

    $this->actingAs($this->admin)
        ->put(route('users.reset-password', $destino), [
            'password' => 'Otra1234',
            'password_confirmation' => 'Otra1234',
        ])
        ->assertSessionHas('success');

    expect(DB::table('sessions')->where('user_id', $destino->id)->count())->toBe(0);
});

it('exige la confirmación de la contraseña', function () {
    [$destino] = crearUsuarioConPuesto();
    $anterior = $destino->password;

    $this->actingAs($this->admin)
        ->put(route('users.reset-password', $destino), [
            'password' => 'Nueva123!',
            'password_confirmation' => 'Distinta123!',
        ])
        ->assertSessionHasErrors('password');

    expect($destino->fresh()->password)->toBe($anterior)
        ->and(Reseteo::count())->toBe(0);
});

it('exige una contraseña de al menos cinco caracteres', function () {
    [$destino] = crearUsuarioConPuesto();

    $this->actingAs($this->admin)
        ->put(route('users.reset-password', $destino), [
            'password' => '1234',
            'password_confirmation' => '1234',
        ])
        ->assertSessionHasErrors('password');

    expect(Reseteo::count())->toBe(0);
});

it('rechaza el reseteo sin el permiso de edición de usuarios', function () {
    [$destino] = crearUsuarioConPuesto();

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

    $operador = User::factory()->create();
    $operador->roles()->sync([$rol->id]);

    $this->actingAs($operador)
        ->put(route('users.reset-password', $destino), [
            'password' => 'Nueva123!',
            'password_confirmation' => 'Nueva123!',
        ])
        ->assertForbidden();

    expect(Reseteo::count())->toBe(0);
});
