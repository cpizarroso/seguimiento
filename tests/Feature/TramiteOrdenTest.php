<?php

use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use App\Services\TramiteService;

it('el listado ordena por sigla de area, anio y numero de menor a mayor sin priorizar urgentes', function () {
    $user = User::factory()->create();
    $areaZZ = Area::factory()->create(['nombre' => 'Área Zeta', 'sigla' => 'ZZ']);
    $areaAA = Area::factory()->create(['nombre' => 'Área Alfa', 'sigla' => 'AA']);

    // Urgente con número alto en ZZ: con el orden viejo saldría primero;
    // con el nuevo debe quedar después de todos los de AA.
    $urgenteZZ = Tramite::factory()->create([
        'area_id' => $areaZZ->id,
        'year' => 2026,
        'numero_tramite' => 99,
        'urgente' => true,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $viejoAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2025,
        'numero_tramite' => 50,
        'urgente' => false,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $nuevoChicoAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2026,
        'numero_tramite' => 3,
        'urgente' => false,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $nuevoGrandeAA = Tramite::factory()->create([
        'area_id' => $areaAA->id,
        'year' => 2026,
        'numero_tramite' => 27,
        'urgente' => false,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);

    $ids = app(TramiteService::class)->listar()->getCollection()->pluck('id')->all();

    expect($ids)->toBe([$viejoAA->id, $nuevoChicoAA->id, $nuevoGrandeAA->id, $urgenteZZ->id]);
});
