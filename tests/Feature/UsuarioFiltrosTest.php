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

it('busca usuarios por nombre de la persona, username y email', function () {
    crearUsuarioConPuesto(null, ['username' => 'buscado', 'email' => 'buscado@ejemplo.gob.bo'], [
        'nombres' => 'Buscado',
        'apellidos' => 'Uno',
    ]);
    crearUsuarioConPuesto(null, ['username' => 'otro', 'email' => 'otro@ejemplo.gob.bo'], [
        'nombres' => 'Otro',
        'apellidos' => 'Usuario',
    ]);

    $this->get(route('users.index', ['search' => 'Buscado']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Buscado Uno'));

    $this->get(route('users.index', ['search' => 'otro@ejemplo']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Otro Usuario'));

    $this->get(route('users.index', ['search' => 'buscado']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.username', 'buscado'));
});

it('busca usuarios por datos de la persona vinculada', function () {
    crearUsuarioConPuesto(null, ['username' => 'cuenta.persona'], [
        'nombres' => 'Lucía',
        'apellidos' => 'Fernández',
        'ci' => '8765432',
    ]);

    $this->get(route('users.index', ['search' => 'Fernández']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->has('users.data', 1));

    $this->get(route('users.index', ['search' => '8765432']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->has('users.data', 1));
});

it('busca usuarios por la combinacion de nombres y apellidos', function () {
    crearUsuarioConPuesto(null, ['username' => 'cuenta.persona'], [
        'nombres' => 'Lucía',
        'apellidos' => 'Fernández',
        'ci' => '8765432',
    ]);

    foreach (['Lucía Fernández', 'Fernández Lucía', 'Lucía Fer', 'Fer Lucía'] as $busqueda) {
        $this->get(route('users.index', ['search' => $busqueda]))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->has('users.data', 1));
    }

    $this->get(route('users.index', ['search' => 'Lucía Gómez']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->has('users.data', 0));
});

it('filtra usuarios por rol', function () {
    crearUsuarioConPuesto(null, ['username' => 'sin.rol']);

    $rolAdmin = Rol::where('slug', 'admin')->first();

    $this->get(route('users.index', ['role_id' => $rolAdmin->id]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.id', $this->admin->id));
});

it('filtra usuarios por area del puesto vigente de su persona', function () {
    $areaA = crearArea('AAA', 'Área A');
    $areaB = crearArea('BBB', 'Área B');

    crearUsuarioConPuesto($areaA, ['username' => 'usuario.a']);
    crearUsuarioConPuesto($areaB, ['username' => 'usuario.b']);

    $this->get(route('users.index', ['area_id' => $areaA->id]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.username', 'usuario.a'));
});

it('entrega las areas para los filtros del listado', function () {
    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->has('areas'));
});
