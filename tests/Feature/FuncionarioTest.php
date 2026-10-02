<?php

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Models\UserPuesto;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@test.com']);
    $adminRol = Rol::where('slug', 'admin')->first();
    $this->admin->roles()->sync([$adminRol->id]);
    $this->actingAs($this->admin);
});

it('puede listar funcionarios', function () {
    Funcionario::factory(3)->create();

    $response = $this->get(route('funcionarios.index'));

    $response->assertOk();
});

it('puede crear un funcionario', function () {
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);

    $response = $this->post(route('funcionarios.store'), [
        'cedula_identidad' => '9999999',
        'nombre' => 'Juan',
        'apellidos' => 'Pérez',
        'email' => 'jperez@ejemplo.gob.bo',
        'tipo_funcionario' => 'contrato',
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);

    $funcionario = Funcionario::where('cedula_identidad', '9999999')->firstOrFail();

    $response->assertRedirect(route('funcionarios.show', $funcionario));
    $this->assertDatabaseHas('funcionarios', [
        'cedula_identidad' => '9999999',
        'estado' => 'activo',
    ]);
});

it('asigna estado activo implicitamente al crear', function () {
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);

    $this->post(route('funcionarios.store'), [
        'cedula_identidad' => '8888888',
        'nombre' => 'Ana',
        'apellidos' => 'Rojas',
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ])->assertRedirect();

    expect(Funcionario::where('cedula_identidad', '8888888')->firstOrFail()->estado)->toBe('activo');
});

it('exige area y puesto al crear', function () {
    $response = $this->post(route('funcionarios.store'), [
        'cedula_identidad' => '7777777',
        'nombre' => 'Luis',
        'apellidos' => 'Rojas',
    ]);

    $response->assertSessionHasErrors(['area_id', 'puesto_id']);
});

it('rechaza un puesto que pertenece a otra area', function () {
    $area = Area::factory()->create();
    $otraArea = Area::factory()->create();
    $puestoAjeno = Puesto::factory()->create(['area_id' => $otraArea->id]);

    $response = $this->post(route('funcionarios.store'), [
        'cedula_identidad' => '6666666',
        'nombre' => 'Luis',
        'apellidos' => 'Rojas',
        'area_id' => $area->id,
        'puesto_id' => $puestoAjeno->id,
    ]);

    $response->assertSessionHasErrors('puesto_id');
});

it('valida campos requeridos al crear', function () {
    $response = $this->post(route('funcionarios.store'), []);

    $response->assertSessionHasErrors(['cedula_identidad', 'nombre', 'apellidos', 'area_id', 'puesto_id']);
});

it('valida cédula única', function () {
    Funcionario::factory()->create(['cedula_identidad' => '1234567']);

    $response = $this->post(route('funcionarios.store'), [
        'nombre' => 'Test',
        'cedula_identidad' => '1234567',
    ]);

    $response->assertSessionHasErrors(['cedula_identidad']);
});

it('puede ver detalle de funcionario', function () {
    $funcionario = Funcionario::factory()->create();

    $response = $this->get(route('funcionarios.show', $funcionario));

    $response->assertOk();
});

it('puede actualizar un funcionario', function () {
    $funcionario = Funcionario::factory()->create();
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);

    $response = $this->put(route('funcionarios.update', $funcionario), [
        'cedula_identidad' => '8765432',
        'nombre' => 'Actualizado',
        'apellidos' => $funcionario->apellidos ?? 'Apellido',
        'tipo_funcionario' => 'item',
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);

    $response->assertRedirect(route('funcionarios.show', $funcionario));
    $this->assertDatabaseHas('funcionarios', [
        'nombre' => 'Actualizado',
        'puesto_id' => $puesto->id,
    ]);
});

it('no permite cambiar el estado al editar', function () {
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);
    $funcionario = Funcionario::factory()->create([
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
        'estado' => 'activo',
    ]);

    $this->put(route('funcionarios.update', $funcionario), [
        'cedula_identidad' => $funcionario->cedula_identidad,
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
        'estado' => 'baja',
    ]);

    expect($funcionario->fresh()->estado)->toBe('activo');
});

it('puede eliminar funcionario aunque tenga trámites como creador (relación con User, no Funcionario)', function () {
    $funcionario = Funcionario::factory()->create();
    $user = User::factory()->create(['funcionario_id' => $funcionario->id]);
    $area = Area::factory()->create();

    Tramite::create([
        'numero_tramite' => 1,
        'year' => now()->year,
        'fecha' => now(),
        'descripcion' => 'Test',
        'estado' => 'iniciado',
        'area_id' => $area->id,
        'creado_por' => $user->id,
    ]);

    $response = $this->delete(route('funcionarios.destroy', $funcionario));

    $response->assertSessionHas('success');
    $this->assertSoftDeleted('funcionarios', ['id' => $funcionario->id]);
});

it('no permite acceso a usuarios no admin', function () {
    $userRol = Rol::where('slug', 'user')->first();
    $nonAdmin = User::factory()->create();
    $nonAdmin->roles()->sync([$userRol->id]);
    $this->actingAs($nonAdmin);
    $funcionario = Funcionario::factory()->create();

    $this->get(route('funcionarios.index'))->assertForbidden();
    $this->get(route('funcionarios.create'))->assertForbidden();
    $this->get(route('funcionarios.edit', $funcionario))->assertForbidden();
    $this->delete(route('funcionarios.destroy', $funcionario))->assertForbidden();
});

it('puede eliminar funcionario sin dependencias', function () {
    $funcionario = Funcionario::factory()->create();

    $response = $this->delete(route('funcionarios.destroy', $funcionario));

    $response->assertRedirect(route('funcionarios.index'));
    $this->assertSoftDeleted($funcionario);
});

it('puede buscar funcionarios', function () {
    Funcionario::factory()->create(['nombre' => 'Roberto']);
    Funcionario::factory()->create(['nombre' => 'Alberto']);

    $response = $this->get(route('funcionarios.index', ['search' => 'Roberto']));

    $response->assertOk();
});

it('puede filtrar por estado', function () {
    Funcionario::factory()->activo()->create(['nombre' => 'Activo']);
    Funcionario::factory()->inactivo()->create(['nombre' => 'Inactivo']);

    $this->get(route('funcionarios.index', ['estado' => 'inactivo']))
        ->assertOk()
        ->assertSee('Inactivo')
        ->assertDontSee('Activo');
});

it('busca por multiples palabras en nombre y apellidos', function () {
    Funcionario::factory()->create(['nombre' => 'Roberto', 'apellidos' => 'Salazar']);
    Funcionario::factory()->create(['nombre' => 'Alberto', 'apellidos' => 'Salazar']);

    $this->get(route('funcionarios.index', ['search' => 'Roberto Salazar']))
        ->assertOk()
        ->assertSee('Roberto')
        ->assertDontSee('Alberto');
});

it('sincroniza el email del funcionario con su usuario vinculado', function () {
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);
    $funcionario = Funcionario::factory()->create([
        'email' => 'nuevo@ejemplo.gob.bo',
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);
    $user = User::factory()->create([
        'funcionario_id' => $funcionario->id,
        'email' => 'anterior@ejemplo.gob.bo',
    ]);

    $this->put(route('funcionarios.update', $funcionario), [
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'cedula_identidad' => $funcionario->cedula_identidad,
        'email' => 'nuevo@ejemplo.gob.bo',
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'email' => 'nuevo@ejemplo.gob.bo',
    ]);
});

it('cierra el puesto anterior del usuario al cambiar el puesto del funcionario', function () {
    $area = Area::factory()->create();
    $puestoAnterior = Puesto::factory()->create(['area_id' => $area->id]);
    $puestoNuevo = Puesto::factory()->create(['area_id' => $area->id]);

    $funcionario = Funcionario::factory()->create([
        'area_id' => $area->id,
        'puesto_id' => $puestoAnterior->id,
    ]);
    $user = User::factory()->create(['funcionario_id' => $funcionario->id]);
    UserPuesto::create([
        'user_id' => $user->id,
        'puesto_id' => $puestoAnterior->id,
        'fecha_inicio' => now()->subMonth()->toDateString(),
    ]);

    $this->put(route('funcionarios.update', $funcionario), [
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'cedula_identidad' => $funcionario->cedula_identidad,
        'area_id' => $area->id,
        'puesto_id' => $puestoNuevo->id,
    ]);

    $this->assertDatabaseHas('user_puesto', [
        'user_id' => $user->id,
        'puesto_id' => $puestoAnterior->id,
        'fecha_fin' => now()->startOfDay(),
    ]);
    $this->assertDatabaseHas('user_puesto', [
        'user_id' => $user->id,
        'puesto_id' => $puestoNuevo->id,
        'fecha_inicio' => now()->startOfDay(),
        'fecha_fin' => null,
    ]);
});

it('no cierra el puesto si el funcionario conserva el mismo puesto', function () {
    $area = Area::factory()->create();
    $puesto = Puesto::factory()->create(['area_id' => $area->id]);

    $funcionario = Funcionario::factory()->create([
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);
    $user = User::factory()->create(['funcionario_id' => $funcionario->id]);
    UserPuesto::create([
        'user_id' => $user->id,
        'puesto_id' => $puesto->id,
        'fecha_inicio' => now()->subMonth()->toDateString(),
    ]);

    $this->put(route('funcionarios.update', $funcionario), [
        'nombre' => $funcionario->nombre,
        'apellidos' => $funcionario->apellidos,
        'cedula_identidad' => $funcionario->cedula_identidad,
        'area_id' => $area->id,
        'puesto_id' => $puesto->id,
    ]);

    $this->assertDatabaseCount('user_puesto', 1);
    $this->assertDatabaseHas('user_puesto', [
        'user_id' => $user->id,
        'fecha_fin' => null,
    ]);
});
