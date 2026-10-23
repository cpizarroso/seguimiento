<?php

use App\Models\Area;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

it('lista el arbol de areas con conteos y opciones de padre', function () {
    $raiz = crearArea('SEM', 'Secretaría');
    $hija = crearArea('DLA', 'Dirección', $raiz);
    crearPersonaConPuesto($hija, null, ['nombres' => 'Una', 'apellidos' => 'Persona']);

    $this->get(route('areas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Areas/Index')
            ->has('areasTree', 1)
            ->has('areasTree.0.children', 1)
            ->has('areasOpciones')
            ->has('responsables'));
});

it('crea un area con puestos estándar seleccionados', function () {
    $this->post(route('areas.store'), [
        'nombre' => 'Área Nueva',
        'codigo' => 'anv',
        'descripcion' => 'Descripción',
        'activo' => true,
        'puestos_estandar' => ['JEFE', 'PROFESIONAL', 'SECRETARIA', 'ASISTENTE'],
    ])->assertRedirect(route('areas.index'));

    $area = Area::where('codigo', 'ANV')->firstOrFail();

    expect($area->puestos)->toHaveCount(4);
    expect($area->puestos->pluck('codigo')->sort()->values()->all())
        ->toBe(['ANV-ASI', 'ANV-JEF', 'ANV-PRO', 'ANV-SEC']);
});

it('crea una subárea indicando el área padre', function () {
    $padre = crearArea('PAD');

    $this->post(route('areas.store'), [
        'nombre' => 'Subárea',
        'codigo' => 'SUB',
        'area_padre_id' => $padre->id,
    ])->assertRedirect(route('areas.index'));

    $this->assertDatabaseHas('areas', [
        'codigo' => 'SUB',
        'area_padre_id' => $padre->id,
    ]);
});

it('rechaza un área padre que genera un ciclo', function () {
    $raiz = crearArea('RAZ');
    $hija = crearArea('HIJ', 'Hija', $raiz);

    $this->put(route('areas.update', $raiz), [
        'nombre' => $raiz->nombre,
        'codigo' => $raiz->codigo,
        'area_padre_id' => $hija->id,
    ])->assertSessionHasErrors(['area_padre_id']);
});

it('no permite eliminar un área con subáreas o puestos', function () {
    $padre = crearArea('PAD2');
    crearArea('HIJ2', 'Hija', $padre);

    $this->delete(route('areas.destroy', $padre))
        ->assertSessionHasErrors('area');

    $conPuesto = crearArea('PUE');
    Puesto::factory()->create(['area_id' => $conPuesto->id]);

    $this->delete(route('areas.destroy', $conPuesto))
        ->assertSessionHasErrors('area');
});

it('no permite eliminar un área con trámites', function () {
    $area = crearArea('TRA');
    $user = User::factory()->create();
    Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id]);

    $this->delete(route('areas.destroy', $area))
        ->assertSessionHasErrors('area');
});

it('puede desactivar y activar un área', function () {
    $area = crearArea('ACT');

    $this->put(route('areas.toggle', $area))->assertRedirect(route('areas.index'));
    expect($area->fresh()->activo)->toBeFalse();

    $this->put(route('areas.toggle', $area))->assertRedirect(route('areas.index'));
    expect($area->fresh()->activo)->toBeTrue();
});

it('crea un puesto con código generado y lo actualiza', function () {
    $area = crearArea('PUE2');

    $this->post(route('areas.puestos.store', $area), [
        'nombre' => 'jefe',
        'descripcion' => 'Jefatura',
        'activo' => true,
    ])->assertRedirect(route('areas.index'));

    $puesto = Puesto::where('area_id', $area->id)->where('nombre', 'JEFE')->firstOrFail();
    expect($puesto->codigo)->toBe('PUE2-JEF');

    $this->put(route('areas.puestos.update', [$area, $puesto]), [
        'nombre' => 'JEFE DE ÁREA',
        'codigo' => $puesto->codigo,
        'activo' => true,
    ])->assertRedirect(route('areas.index'));

    expect($puesto->fresh()->nombre)->toBe('JEFE DE ÁREA');
});

it('no permite eliminar un puesto con personas asignadas', function () {
    $persona = crearPersonaConPuesto();
    $puesto = $persona->puestoActivo->puesto;
    $area = $puesto->area;

    $this->delete(route('areas.puestos.destroy', [$area, $puesto]))
        ->assertSessionHasErrors('puesto');
});

it('conserva el estado activo al actualizar sin enviar el campo', function () {
    $area = crearArea('EST');

    $this->put(route('areas.update', $area), [
        'nombre' => 'Área renombrada',
        'codigo' => $area->codigo,
    ])->assertRedirect(route('areas.index'));

    expect($area->fresh()->activo)->toBeTrue();

    $puesto = Puesto::factory()->create([
        'area_id' => $area->id,
        'activo' => true,
    ]);

    $this->put(route('areas.puestos.update', [$area, $puesto]), [
        'nombre' => 'PUESTO RENOMBRADO',
        'codigo' => $puesto->codigo,
    ])->assertRedirect(route('areas.index'));

    expect($puesto->fresh()->activo)->toBeTrue();
});
