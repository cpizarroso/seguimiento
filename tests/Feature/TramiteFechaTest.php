<?php

use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Services\ContadorTramiteService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->firstOrFail()->id]);
    $this->actingAs($this->admin);
});

it('guarda la fecha elegida sin sincronizar created_at', function () {
    $area = crearArea('FEC');
    $fecha = now()->subMonths(3)->startOfMinute();

    $this->post(route('tramites.store'), [
        'descripcion' => 'Con fecha manual',
        'area_id' => $area->id,
        'fecha' => $fecha->format('Y-m-d\TH:i'),
    ])->assertRedirect();

    $tramite = Tramite::where('descripcion', 'Con fecha manual')->firstOrFail();

    expect($tramite->fecha->format('Y-m-d H:i'))->toBe($fecha->format('Y-m-d H:i'))
        ->and($tramite->created_at->format('Y-m-d'))->not->toBe($tramite->fecha->format('Y-m-d'));
});

it('numera con el año de la fecha elegida', function () {
    $area = crearArea('ANU');

    $this->post(route('tramites.store'), [
        'descripcion' => 'Trámite de 2024',
        'area_id' => $area->id,
        'fecha' => '2024-05-10T09:30',
    ])->assertRedirect();

    $this->post(route('tramites.store'), [
        'descripcion' => 'Otro de 2024',
        'area_id' => $area->id,
        'fecha' => '2024-06-11T08:00',
    ])->assertRedirect();

    $primero = Tramite::where('descripcion', 'Trámite de 2024')->firstOrFail();
    $segundo = Tramite::where('descripcion', 'Otro de 2024')->firstOrFail();

    expect($primero->year)->toBe(2024)
        ->and($primero->numero_tramite)->toBe(1)
        ->and($primero->numero_completo)->toBe('ANU-0001/2024')
        ->and($segundo->numero_tramite)->toBe(2)
        ->and($segundo->numero_completo)->toBe('ANU-0002/2024');
});

it('usa la fecha actual cuando no se envia fecha', function () {
    $area = crearArea('AHO');

    $this->post(route('tramites.store'), [
        'descripcion' => 'Sin fecha',
        'area_id' => $area->id,
    ])->assertRedirect();

    $tramite = Tramite::where('descripcion', 'Sin fecha')->firstOrFail();

    expect($tramite->fecha->isSameMinute(now()))->toBeTrue()
        ->and($tramite->year)->toBe((int) now()->year);
});

it('rechaza una fecha futura', function () {
    $area = crearArea('AFU');

    $this->post(route('tramites.store'), [
        'descripcion' => 'Fecha futura',
        'area_id' => $area->id,
        'fecha' => now()->addDay()->format('Y-m-d\TH:i'),
    ])->assertSessionHasErrors('fecha');

    expect(Tramite::where('descripcion', 'Fecha futura')->exists())->toBeFalse();
});

it('rechaza una fecha con formato invalido', function () {
    $area = crearArea('AFO');

    $this->post(route('tramites.store'), [
        'descripcion' => 'Formato inválido',
        'area_id' => $area->id,
        'fecha' => '2024-05-10 09:30',
    ])->assertSessionHasErrors('fecha');
});

it('ordena por la columna fecha', function () {
    $area = crearArea('ORD');

    $viejo = Tramite::factory()->create(['area_id' => $area->id, 'fecha' => '2024-01-01 10:00:00']);
    $nuevo = Tramite::factory()->create(['area_id' => $area->id, 'fecha' => '2025-01-01 10:00:00']);

    $ids = app(TramiteService::class)
        ->listar(['sort' => 'fecha', 'direction' => 'asc'])
        ->getCollection()
        ->pluck('id')
        ->all();

    expect(array_search($viejo->id, $ids, true))->toBeLessThan(array_search($nuevo->id, $ids, true));
});

it('expone las secuencias del año solicitado', function () {
    $area = crearArea('YRC');
    app(ContadorTramiteService::class)->siguienteNumero($area->id, 2024);

    $this->get(route('tramites.create', ['year' => 2024]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Tramites/Create')
            ->where("secuencias.{$area->id}.ultimo_numero", 1)
            ->where("secuencias.{$area->id}.siguiente", 2)
        );
});
