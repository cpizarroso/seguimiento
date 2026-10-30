<?php

use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
});

function usuarioDeRolParaCrear(string $slug): User
{
    $usuario = User::factory()->create();
    $usuario->roles()->sync([Rol::where('slug', $slug)->firstOrFail()->id]);

    return $usuario;
}

it('permite a un usuario con rol user crear tramites en sus areas habilitadas', function () {
    $area = crearArea('USR');
    $usuario = usuarioDeRolParaCrear('user');
    $usuario->areasHabilitadas()->sync([$area->id => ['predeterminada' => true]]);

    $this->actingAs($usuario)
        ->get(route('tramites.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Tramites/Create')
            ->has('areas.data', 1),
        );

    $this->actingAs($usuario)
        ->post(route('tramites.store'), [
            'descripcion' => 'Trámite creado por un usuario raso',
            'area_id' => $area->id,
        ])
        ->assertRedirect();

    expect(Tramite::where('descripcion', 'Trámite creado por un usuario raso')->exists())->toBeTrue();
});

it('permite a un usuario con rol jefe crear tramites en sus areas habilitadas', function () {
    $area = crearArea('JEF');
    $usuario = usuarioDeRolParaCrear('jefe');
    $usuario->areasHabilitadas()->sync([$area->id => ['predeterminada' => true]]);

    $this->actingAs($usuario)
        ->get(route('tramites.create'))
        ->assertOk();

    $this->actingAs($usuario)
        ->post(route('tramites.store'), [
            'descripcion' => 'Trámite creado por un jefe',
            'area_id' => $area->id,
        ])
        ->assertRedirect();

    expect(Tramite::where('descripcion', 'Trámite creado por un jefe')->exists())->toBeTrue();
});

it('rechaza la creacion en un area no habilitada aunque tenga el permiso', function () {
    $habilitada = crearArea('HAB');
    $ajena = crearArea('AJN');

    $usuario = usuarioDeRolParaCrear('user');
    $usuario->areasHabilitadas()->sync([$habilitada->id => ['predeterminada' => true]]);

    $this->actingAs($usuario)
        ->post(route('tramites.store'), [
            'descripcion' => 'Trámite en área ajena',
            'area_id' => $ajena->id,
        ])
        ->assertSessionHasErrors('area_id');

    expect(Tramite::where('descripcion', 'Trámite en área ajena')->exists())->toBeFalse();
});

it('no expone areas de creacion a un usuario sin areas habilitadas', function () {
    $area = crearArea('SIN');
    $usuario = usuarioDeRolParaCrear('user');

    $this->actingAs($usuario)
        ->get(route('tramites.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Tramites/Create')
            ->has('areas.data', 0),
        );

    $this->actingAs($usuario)
        ->post(route('tramites.store'), [
            'descripcion' => 'Trámite sin área habilitada',
            'area_id' => $area->id,
        ])
        ->assertSessionHasErrors('area_id');
});
