<?php

use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->firstOrFail()->id]);
});

/**
 * @param  array<int, string>  $acciones
 */
function usuarioConAccionesDeUsuarios(array $acciones): User
{
    $rol = Rol::create([
        'nombre' => 'Rol usuarios '.implode('-', $acciones).' '.uniqid(),
        'slug' => 'usuarios-'.implode('-', $acciones).'-'.uniqid(),
        'descripcion' => null,
        'es_sistema' => false,
    ]);

    $rol->permisos()->sync(
        Permiso::query()
            ->whereHas('modulo', fn ($query) => $query->where('slug', 'usuarios'))
            ->whereHas('accion', fn ($query) => $query->whereIn('slug', $acciones))
            ->pluck('id')
            ->all()
    );

    $usuario = User::factory()->create();
    $usuario->roles()->sync([$rol->id]);

    return $usuario;
}

it('con solo consulta puede listar y ver pero no crear, editar ni eliminar', function () {
    $consulta = usuarioConAccionesDeUsuarios(['consulta']);
    $otro = User::factory()->create();

    $this->actingAs($consulta)->get(route('users.index'))->assertOk();
    $this->actingAs($consulta)->get(route('users.show', $otro))->assertOk();

    $this->actingAs($consulta)->get(route('users.create'))->assertForbidden();
    $this->actingAs($consulta)->post(route('users.store'), [])->assertForbidden();
    $this->actingAs($consulta)->get(route('users.edit', $otro))->assertForbidden();
    $this->actingAs($consulta)->put(route('users.update', $otro), [])->assertForbidden();
    $this->actingAs($consulta)->put(route('users.reset-password', $otro), [])->assertForbidden();
    $this->actingAs($consulta)->put(route('users.estado.update', $otro), [])->assertForbidden();
    $this->actingAs($consulta)->delete(route('users.destroy', $otro))->assertForbidden();
});

it('la creacion exige la acción creacion y no la captura la ruta de detalle', function () {
    $creador = usuarioConAccionesDeUsuarios(['consulta', 'creacion']);

    $this->actingAs($creador)->get(route('users.create'))->assertOk();

    $this->actingAs($creador)->put(route('users.estado.update', $this->admin), [])->assertForbidden();
});

it('la edicion habilita el formulario, el reseteo y el cambio de estado', function () {
    $editor = usuarioConAccionesDeUsuarios(['consulta', 'edicion']);

    $this->actingAs($editor)->get(route('users.edit', $this->admin))->assertOk();

    $this->actingAs($editor)
        ->put(route('users.reset-password', $this->admin), [])
        ->assertSessionHasErrors();

    $this->actingAs($editor)
        ->put(route('users.estado.update', $this->admin), [])
        ->assertSessionHasErrors();

    $this->actingAs($editor)->delete(route('users.destroy', $this->admin))->assertForbidden();
});

it('la baja permite eliminar usuarios', function () {
    $operador = usuarioConAccionesDeUsuarios(['consulta', 'baja']);
    $objetivo = User::factory()->create();

    $this->actingAs($operador)
        ->delete(route('users.destroy', $objetivo))
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', ['id' => $objetivo->id]);
});
