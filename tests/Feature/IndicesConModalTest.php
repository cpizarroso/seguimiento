<?php

use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

it('el indice de personas entrega areas y puestos para los modales', function () {
    $this->get(route('personas.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Personas/Index')
            ->has('personas.data')
            ->has('areas')
            ->has('puestos'),
        );
});

it('el indice de areas entrega el arbol para el modal de creacion', function () {
    $this->get(route('areas.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Areas/Index')
            ->has('areasTree')
            ->has('areasOpciones')
            ->has('responsables'),
        );
});

it('el indice de usuarios entrega roles y personas para el modal de creacion', function () {
    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Users/Index')
            ->has('roles.data')
            ->has('personas.data'),
        );
});

it('el indice de roles entrega los permisos agrupados para el modal de creacion', function () {
    $this->get(route('roles.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Roles/Index')
            ->has('permisos_agrupados'),
        );
});

it('crear un area desde el listado vuelve al listado y no al detalle', function () {
    $response = $this->post(route('areas.store'), [
        'nombre' => 'Área desde modal',
        'codigo' => 'AMD',
        'activo' => true,
        'puestos_estandar' => ['JEFE', 'PROFESIONAL'],
    ]);

    $response->assertRedirect(route('areas.index'));
    $this->assertDatabaseHas('areas', ['nombre' => 'Área desde modal', 'codigo' => 'AMD']);
    $this->assertDatabaseHas('puestos', ['codigo' => 'AMD-JEF']);
    $this->assertDatabaseHas('puestos', ['codigo' => 'AMD-PRO']);
});
