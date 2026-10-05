<?php

use App\Models\Area;
use App\Models\User;
use App\Services\DerivacionService;
use App\Services\TramiteService;

it('genera la derivacion inicial recepcionada al crear un tramite', function () {
    $area = Area::factory()->create(['nombre' => 'Observer '.uniqid(), 'sigla' => 'OBS']);
    $creador = User::factory()->create();

    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite con derivación inicial',
        'area_id' => $area->id,
    ], $creador->id);

    $derivacion = $tramite->derivaciones()->first();

    expect($derivacion)->not->toBeNull()
        ->and($derivacion->numero_derivacion)->toBe(1)
        ->and($derivacion->derivado_de)->toBe($creador->id)
        ->and($derivacion->derivado_a)->toBe($creador->id)
        ->and($derivacion->glosa_derivacion)->toBe('recepcion tramite')
        ->and($derivacion->estado)->toBe('recepcionado')
        ->and($derivacion->fecha_recepcion)->not->toBeNull();
});

it('la siguiente derivacion manual toma el numero 2', function () {
    $area = Area::factory()->create(['nombre' => 'Observer2 '.uniqid(), 'sigla' => 'OB2']);
    $creador = User::factory()->create();
    $destino = User::factory()->create();

    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite con segunda derivación',
        'area_id' => $area->id,
    ], $creador->id);

    $segunda = app(DerivacionService::class)->derivar($tramite, $destino->id, 'Derivación manual');

    expect($segunda->numero_derivacion)->toBe(2)
        ->and($segunda->derivado_a)->toBe($destino->id);
});

it('crearPrimeraDerivacion es idempotente ante llamadas repetidas', function () {
    $area = Area::factory()->create(['nombre' => 'Observer3 '.uniqid(), 'sigla' => 'OB3']);
    $creador = User::factory()->create();

    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite con primera repetida',
        'area_id' => $area->id,
    ], $creador->id);

    $primera = $tramite->crearPrimeraDerivacion();
    $repetida = $tramite->crearPrimeraDerivacion();

    expect($repetida->id)->toBe($primera->id)
        ->and($tramite->derivaciones()->count())->toBe(1);
});

it('el detalle del tramite incluye el historial de derivaciones', function () {
    $area = Area::factory()->create(['nombre' => 'Observer4 '.uniqid(), 'sigla' => 'OB4']);
    $creador = User::factory()->create();

    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite con historial visible',
        'area_id' => $area->id,
    ], $creador->id);

    $this->actingAs($creador)
        ->get(route('tramites.show', $tramite))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tramites/Show')
            ->has('tramite.derivaciones', 1)
            ->where('tramite.derivaciones.0.glosa_derivacion', 'recepcion tramite')
            ->where('tramite.derivaciones.0.estado', 'recepcionado')
        );
});
