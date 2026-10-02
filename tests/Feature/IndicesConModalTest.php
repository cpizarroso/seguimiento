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

it('el indice de funcionarios entrega areas y puestos para el modal de creacion', function () {
    $this->get(route('funcionarios.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Funcionarios/Index')
            ->has('areas.data')
            ->has('puestos.data'),
        );
});

it('el indice de areas entrega el arbol para el modal de creacion', function () {
    $this->get(route('areas.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Areas/Index')
            ->has('areasTree'),
        );
});

it('el indice de usuarios entrega areas, puestos, roles y funcionarios para el modal de creacion', function () {
    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Users/Index')
            ->has('areas.data')
            ->has('puestos.data')
            ->has('roles.data')
            ->has('funcionarios.data'),
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
        'sigla' => 'AMD',
        'estado' => true,
        'puestos' => [],
    ]);

    $response->assertRedirect(route('areas.index'));
    $this->assertDatabaseHas('areas', ['nombre' => 'Área desde modal']);
});
