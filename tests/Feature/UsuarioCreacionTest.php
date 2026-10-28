<?php

use App\Models\Persona;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
});

function payloadCreacionUsuario(Persona $persona, array $overrides = []): array
{
    return array_merge([
        'username' => 'usuario.creado',
        'email' => 'usuario.creado@ejemplo.gob.bo',
        'password' => 'secret123',
        'persona_id' => $persona->id,
        'role_ids' => [],
    ], $overrides);
}

it('vuelve a la página de creación para mostrar el reporte de acceso', function () {
    $persona = Persona::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('users.store', ['desde' => 'create']), payloadCreacionUsuario($persona))
        ->assertRedirect(route('users.create'))
        ->assertSessionHas('success');

    expect(User::where('email', 'usuario.creado@ejemplo.gob.bo')->exists())->toBeTrue();
});

it('redirige al listado tras crear desde el índice', function () {
    $persona = Persona::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('users.store'), payloadCreacionUsuario($persona))
        ->assertRedirect(route('users.index'));
});
