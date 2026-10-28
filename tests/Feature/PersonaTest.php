<?php

use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create(['email' => 'admin@test.com']);
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

it('puede listar personas', function () {
    Persona::factory(3)->create();

    $this->get(route('personas.index'))->assertOk();
});

it('puede crear una persona con puesto vigente', function () {
    $puesto = Puesto::factory()->create();

    $response = $this->post(route('personas.store'), [
        'nombres' => 'Juan',
        'apellidos' => 'Pérez',
        'ci' => '9999999',
        'correo' => 'jperez@ejemplo.gob.bo',
        'puesto_id' => $puesto->id,
    ]);

    $persona = Persona::where('ci', '9999999')->firstOrFail();

    $response->assertRedirect(route('personas.index'));
    $this->assertDatabaseHas('personas', [
        'ci' => '9999999',
        'activo' => true,
    ]);
    $this->assertDatabaseHas('persona_puesto', [
        'persona_id' => $persona->id,
        'puesto_id' => $puesto->id,
        'fecha_fin' => null,
    ]);
});

it('puede crear una persona sin puesto', function () {
    $this->post(route('personas.store'), [
        'nombres' => 'Ana',
        'apellidos' => 'Rojas',
        'ci' => '8888888',
        'correo' => 'arojas@ejemplo.gob.bo',
    ])->assertRedirect(route('personas.index'));

    expect(Persona::where('ci', '8888888')->firstOrFail()->puestoActivo)->toBeNull();
});

it('valida campos requeridos al crear', function () {
    $this->post(route('personas.store'), [])
        ->assertSessionHasErrors(['nombres', 'apellidos', 'ci', 'correo']);
});

it('valida cédula única', function () {
    Persona::factory()->create(['ci' => '1234567']);

    $this->post(route('personas.store'), [
        'nombres' => 'Test',
        'apellidos' => 'Test',
        'ci' => '1234567',
        'correo' => 'test-unico@ejemplo.gob.bo',
    ])->assertSessionHasErrors(['ci']);
});

it('valida correo único y obligatorio', function () {
    $persona = Persona::factory()->create();

    $this->post(route('personas.store'), [
        'nombres' => 'Test',
        'apellidos' => 'Test',
        'ci' => '7654321',
        'correo' => $persona->correo,
    ])->assertSessionHasErrors(['correo']);

    $this->post(route('personas.store'), [
        'nombres' => 'Test',
        'apellidos' => 'Test',
        'ci' => '7654322',
    ])->assertSessionHasErrors(['correo']);
});

it('puede actualizar una persona y conservar el puesto si no cambia', function () {
    $persona = crearPersonaConPuesto(null, null, ['ci' => '1000001']);
    $puestoId = $persona->puestoActivo->puesto_id;

    $this->put(route('personas.update', $persona), [
        'nombres' => 'Actualizado',
        'apellidos' => $persona->apellidos,
        'ci' => $persona->ci,
        'correo' => $persona->correo,
        'puesto_id' => $puestoId,
    ])->assertRedirect(route('personas.index'));

    expect($persona->fresh()->nombres)->toBe('Actualizado');
    expect(PersonaPuesto::where('persona_id', $persona->id)->count())->toBe(1);
});

it('cambia el puesto y deja el anterior en el historial', function () {
    $area = crearArea('HIS');
    $puestoAnterior = Puesto::factory()->create(['area_id' => $area->id]);
    $puestoNuevo = Puesto::factory()->create(['area_id' => $area->id]);
    $persona = crearPersonaConPuesto($area, $puestoAnterior, ['ci' => '1000002']);

    $this->put(route('personas.puesto.update', $persona), [
        'puesto_id' => $puestoNuevo->id,
    ])->assertRedirect(route('personas.index'));

    $historial = PersonaPuesto::where('persona_id', $persona->id)->orderBy('id')->get();

    expect($historial)->toHaveCount(2);
    expect($historial[0]->fecha_fin)->not->toBeNull();
    expect($historial[1]->fecha_fin)->toBeNull();
    expect($historial[1]->puesto_id)->toBe($puestoNuevo->id);
});

it('valida que el puesto exista al cambiarlo', function () {
    $persona = crearPersonaConPuesto();

    $this->put(route('personas.puesto.update', $persona), [
        'puesto_id' => 999999,
    ])->assertSessionHasErrors(['puesto_id']);
});

it('no permite eliminar una persona con usuario vinculado', function () {
    $persona = Persona::factory()->create();
    User::factory()->create(['persona_id' => $persona->id]);

    $this->delete(route('personas.destroy', $persona))
        ->assertSessionHasErrors('persona');

    $this->assertDatabaseHas('personas', ['id' => $persona->id]);
});

it('no permite eliminar una persona con historial de puestos', function () {
    $persona = crearPersonaConPuesto();

    $this->delete(route('personas.destroy', $persona))
        ->assertSessionHasErrors('persona');

    $this->assertDatabaseHas('personas', ['id' => $persona->id]);
});

it('puede eliminar una persona sin dependencias', function () {
    $persona = Persona::factory()->create();

    $this->delete(route('personas.destroy', $persona))
        ->assertRedirect(route('personas.index'));

    $this->assertDatabaseMissing('personas', ['id' => $persona->id]);
});

it('puede buscar personas por múltiples palabras', function () {
    Persona::factory()->create(['nombres' => 'Roberto', 'apellidos' => 'Salazar']);
    Persona::factory()->create(['nombres' => 'Alberto', 'apellidos' => 'Salazar']);

    $this->get(route('personas.index', ['search' => 'Roberto Salazar']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('personas.data.0.nombres', 'Roberto')
            ->where('personas.meta.total', 1));
});

it('puede filtrar personas por estado', function () {
    Persona::factory()->create(['nombres' => 'Activa', 'activo' => true]);
    Persona::factory()->create(['nombres' => 'Inactiva', 'activo' => false]);

    $this->get(route('personas.index', ['activo' => '0']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('personas.meta.total', 1)
            ->where('personas.data.0.nombres', 'Inactiva'));
});

it('no cambia el email de acceso al editar el correo de la persona', function () {
    $persona = crearPersonaConPuesto();

    $user = User::factory()->create([
        'persona_id' => $persona->id,
        'email' => 'anterior@ejemplo.gob.bo',
    ]);

    $this->put(route('personas.update', $persona), [
        'nombres' => $persona->nombres,
        'apellidos' => $persona->apellidos,
        'ci' => $persona->ci,
        'correo' => 'nuevo@ejemplo.gob.bo',
    ])->assertRedirect(route('personas.index'));

    expect($persona->fresh()->correo)->toBe('nuevo@ejemplo.gob.bo')
        ->and($user->fresh()->email)->toBe('anterior@ejemplo.gob.bo');
});

it('no permite acceso a usuarios sin permiso de personas', function () {
    $userRol = Rol::where('slug', 'user')->first();
    $nonAdmin = User::factory()->create();
    $nonAdmin->roles()->sync([$userRol->id]);
    $this->actingAs($nonAdmin);
    $persona = Persona::factory()->create();

    $this->get(route('personas.index'))->assertForbidden();
    $this->post(route('personas.store'), [])->assertForbidden();
    $this->put(route('personas.update', $persona), [])->assertForbidden();
    $this->delete(route('personas.destroy', $persona))->assertForbidden();
});
