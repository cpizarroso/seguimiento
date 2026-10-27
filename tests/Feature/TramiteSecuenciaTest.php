<?php

use App\Models\ContadorTramite;
use App\Models\Rol;
use App\Models\User;
use App\Services\ContadorTramiteService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

it('expone la secuencia vigente de cada area en el listado', function () {
    $area = crearArea('SEC');
    $contador = app(ContadorTramiteService::class);

    $contador->siguienteNumero($area->id, now()->year);
    $contador->siguienteNumero($area->id, now()->year);

    $this->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Tramites/Index')
            ->where("secuencias.{$area->id}.ultimo_numero", 2)
            ->where("secuencias.{$area->id}.siguiente", 3)
            ->where("secuencias.{$area->id}.ultimo_completo", sprintf('SEC-0002/%d', now()->year))
            ->where("secuencias.{$area->id}.numero_completo", sprintf('SEC-0003/%d', now()->year)),
        );
});

it('muestra el primer numero cuando el area todavia no tiene contador', function () {
    $area = crearArea('NUE');

    $this->get(route('tramites.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Tramites/Create')
            ->where("secuencias.{$area->id}.ultimo_numero", 0)
            ->where("secuencias.{$area->id}.siguiente", 1)
            ->where("secuencias.{$area->id}.ultimo_completo", null)
            ->where("secuencias.{$area->id}.numero_completo", sprintf('NUE-0001/%d', now()->year)),
        );

    expect(ContadorTramite::where('area_id', $area->id)->exists())->toBeFalse();
});

it('avanza la secuencia despues de crear un tramite', function () {
    $area = crearArea('AVZ');
    $creador = User::factory()->create();

    app(TramiteService::class)->crear(['descripcion' => 'Trámite de prueba', 'area_id' => $area->id], $creador->id);

    $this->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where("secuencias.{$area->id}.ultimo_numero", 1)
            ->where("secuencias.{$area->id}.siguiente", 2)
            ->where("secuencias.{$area->id}.numero_completo", sprintf('AVZ-0002/%d', now()->year)),
        );
});

it('solo expone las secuencias de las areas habilitadas del usuario', function () {
    $habilitada = crearArea('HAB');
    $otra = crearArea('OTR');

    $usuario = User::factory()->create();
    $usuario->roles()->sync([Rol::where('slug', 'user')->first()->id]);
    $usuario->areasHabilitadas()->sync([$habilitada->id => ['predeterminada' => true]]);

    $this->actingAs($usuario)->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has("secuencias.{$habilitada->id}")
            ->missing("secuencias.{$otra->id}"),
        );
});
