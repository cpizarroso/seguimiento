<?php

use App\Exports\TramitesExport;
use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use App\Services\TramiteService;

it('el filtro area_id muestra solo los tramites de esa area', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Uno', 'sigla' => 'F1']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Dos', 'sigla' => 'F2']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar(['area_id' => (string) $areaA->id])->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deA->id)->not->toContain($deB->id);
});

it('sin filtro de area el listado incluye todas las areas', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Tres', 'sigla' => 'F3']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Cuatro', 'sigla' => 'F4']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar()->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deA->id, $deB->id);
});

it('la exportacion respeta el filtro de area', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Cinco', 'sigla' => 'F5']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Seis', 'sigla' => 'F6']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramitesExport::class, ['filtros' => ['area_id' => (string) $areaA->id]])->collection()->pluck('id')->all();

    expect($ids)->toContain($deA->id)->not->toContain($deB->id);
});
