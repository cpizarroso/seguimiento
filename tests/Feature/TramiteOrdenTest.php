<?php

use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use App\Services\TramiteService;

it('el listado ordena por fecha de creación descendente sin priorizar urgentes', function () {
    $user = User::factory()->create();
    $areaZZ = Area::factory()->create(['nombre' => 'Área Zeta', 'codigo' => 'ZZ']);
    $areaAA = Area::factory()->create(['nombre' => 'Área Alfa', 'codigo' => 'AA']);

    // Urgente antiguo: debe quedar debajo de los más recientes.
    $urgenteZZ = Tramite::factory()->create([
        'area_id' => $areaZZ->id,
        'year' => 2026,
        'numero_tramite' => 99,
        'urgente' => true,
        'created_at' => now()->subDays(2),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $viejoAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2025,
        'numero_tramite' => 50,
        'urgente' => false,
        'created_at' => now()->subDays(5),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $nuevoChicoAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2026,
        'numero_tramite' => 3,
        'urgente' => false,
        'created_at' => now()->subDay(),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $nuevoGrandeAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2026,
        'numero_tramite' => 27,
        'urgente' => false,
        'created_at' => now(),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);

    $ids = app(TramiteService::class)->listar()->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$nuevoGrandeAA->id, $nuevoChicoAA->id, $urgenteZZ->id, $viejoAA->id]);
});

it('ordena por numero de tramite ascendente', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Número', 'codigo' => 'NU']);

    $nueve = Tramite::factory()->create(['area_id' => $area->id, 'year' => 2026, 'numero_tramite' => 9, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $dos = Tramite::factory()->create(['area_id' => $area->id, 'year' => 2026, 'numero_tramite' => 2, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $cinco = Tramite::factory()->create(['area_id' => $area->id, 'year' => 2026, 'numero_tramite' => 5, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar(['sort' => 'numero_tramite', 'direction' => 'asc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$dos->id, $cinco->id, $nueve->id]);
});

it('ordena por fecha de creación descendente', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Fechas', 'codigo' => 'FE']);

    $antiguo = Tramite::factory()->create([
        'area_id' => $area->id,
        'created_at' => now()->subDays(3),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $reciente = Tramite::factory()->create([
        'area_id' => $area->id,
        'created_at' => now()->subDay(),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);

    $ids = app(TramiteService::class)->listar(['sort' => 'created_at', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$reciente->id, $antiguo->id]);
});

it('ordena por área descendente', function () {
    $user = User::factory()->create();
    $areaAA = Area::factory()->create(['nombre' => 'Área Orden A', 'codigo' => 'OA']);
    $areaZZ = Area::factory()->create(['nombre' => 'Área Orden Z', 'codigo' => 'OZ']);

    $deAA = Tramite::factory()->create(['area_id' => $areaAA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deZZ = Tramite::factory()->create(['area_id' => $areaZZ->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar(['sort' => 'area', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$deZZ->id, $deAA->id]);
});

it('ordena por días transcurridos descendente', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Días', 'codigo' => 'DI']);

    $reciente = Tramite::factory()->create([
        'area_id' => $area->id,
        'created_at' => now()->subDay(),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $antiguo = Tramite::factory()->create([
        'area_id' => $area->id,
        'created_at' => now()->subDays(10),
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);

    $ids = app(TramiteService::class)->listar(['sort' => 'dias_transcurridos', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$antiguo->id, $reciente->id]);
});

it('ordena por la última derivación', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Derivación', 'codigo' => 'DE']);

    $antiguo = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $reciente = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $antiguo->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now()->subDays(5),
        'glosa_derivacion' => 'Derivación antigua',
        'estado' => 'recepcionado',
    ]);
    $reciente->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now()->subDay(),
        'glosa_derivacion' => 'Derivación reciente',
        'estado' => 'recepcionado',
    ]);

    $ids = app(TramiteService::class)->listar(['sort' => 'ultima_derivacion', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$reciente->id, $antiguo->id]);
});

it('el listado carga solo la última derivación de cada trámite', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Última', 'codigo' => 'UL']);

    $tramite = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $tramite->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now(),
        'glosa_derivacion' => 'Segunda derivación',
        'estado' => 'recepcionado',
    ]);

    $item = app(TramiteService::class)->listar()->getCollection()->firstWhere('id', $tramite->id);

    expect($item->derivaciones)->toHaveCount(1)
        ->and($item->derivaciones->first()->numero_derivacion)->toBe(2);
});

it('ordena por el estado de la última derivación', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Área Recepción', 'codigo' => 'RE']);

    $pendiente = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $recepcionado = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $rechazado = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    foreach ([
        [$pendiente, 'derivado'],
        [$rechazado, 'rechazado'],
    ] as [$tramite, $estado]) {
        $tramite->derivaciones()->create([
            'numero_derivacion' => 2,
            'derivado_de' => $user->id,
            'derivado_a' => $user->id,
            'fecha_derivacion' => now(),
            'glosa_derivacion' => 'Derivación '.$estado,
            'estado' => $estado,
        ]);
    }

    $servicio = app(TramiteService::class);

    $ascendente = $servicio->listar(['sort' => 'estado_derivacion', 'direction' => 'asc'])->getCollection()->pluck('id')->all();
    $descendente = $servicio->listar(['sort' => 'estado_derivacion', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ascendente)->toBe([$pendiente->id, $recepcionado->id, $rechazado->id])
        ->and($descendente)->toBe([$rechazado->id, $recepcionado->id, $pendiente->id]);
});

it('ignora un campo de orden no permitido y mantiene el orden por defecto', function () {
    $user = User::factory()->create();
    $areaAA = Area::factory()->create(['nombre' => 'Área Segura A', 'codigo' => 'SA']);
    $areaZZ = Area::factory()->create(['nombre' => 'Área Segura Z', 'codigo' => 'SZ']);

    $deZZ = Tramite::factory()->create(['area_id' => $areaZZ->id, 'numero_tramite' => 10, 'created_at' => now()->subDay(), 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deAA = Tramite::factory()->create(['area_id' => $areaAA->id, 'numero_tramite' => 20, 'created_at' => now(), 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar(['sort' => 'descripcion; DROP TABLE tramites', 'direction' => 'desc'])->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$deAA->id, $deZZ->id]);
});
