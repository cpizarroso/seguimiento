<?php

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->artisan('migrate');
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

    $response = $this->post(route('funcionarios.store'), [
        'nombre' => 'Juan',
        'apellidos' => 'Pérez',
        'email' => 'jperez@ejemplo.gob.bo',
        'cedula_identidad' => '9999999',
        'tipo_funcionario' => 'contrato',
        'nivel' => 'Analista',
        'estado' => 'activo',
        'area_id' => $area->id,
    ]);

    $response->assertRedirect(route('funcionarios.index'));
    $this->assertDatabaseHas('funcionarios', ['cedula_identidad' => '9999999']);
});

it('valida campos requeridos al crear', function () {
    $response = $this->post(route('funcionarios.store'), []);

    $response->assertSessionHasErrors(['nombre']);
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

    $response = $this->put(route('funcionarios.update', $funcionario), [
        'cedula_identidad' => '8765432',
        'nombre' => 'Actualizado',
        'apellidos' => $funcionario->apellidos ?? 'Apellido',
        'tipo_funcionario' => 'item',
        'estado' => 'inactivo',
        'area_id' => $area->id,
    ]);

    $response->assertRedirect(route('funcionarios.index'));
    $this->assertDatabaseHas('funcionarios', ['nombre' => 'Actualizado', 'estado' => 'inactivo']);
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
    Funcionario::factory()->activo()->create();
    Funcionario::factory()->inactivo()->create();

    $response = $this->get(route('funcionarios.index', ['estado' => 'inactivo']));

    $response->assertOk();
});
