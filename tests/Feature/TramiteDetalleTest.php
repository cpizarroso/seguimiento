<?php

use App\Models\Tramite;
use App\Services\TramiteService;

it('carga el nombre, puesto y area de quienes derivan y reciben', function () {
    [$de, , $areaDe] = crearUsuarioConPuesto(null, [], ['nombres' => 'Ana', 'apellidos' => 'Pérez']);
    [$a, , $areaA] = crearUsuarioConPuesto(null, [], ['nombres' => 'Luis', 'apellidos' => 'Gómez']);

    $tramite = Tramite::factory()->create([
        'area_id' => $areaDe->id,
        'creado_por' => $de->id,
        'derivado_a' => $a->id,
    ]);

    $tramite->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $de->id,
        'derivado_a' => $a->id,
        'fecha_derivacion' => now(),
        'glosa_derivacion' => 'Derivación de prueba',
        'fecha_recepcion' => now(),
        'estado' => 'recepcionado',
    ]);

    $cargado = app(TramiteService::class)->obtenerPorId($tramite->id);
    $derivacion = $cargado->derivaciones->firstWhere('numero_derivacion', 2);

    expect($derivacion)->not->toBeNull()
        ->and($derivacion->de->relationLoaded('persona'))->toBeTrue()
        ->and($derivacion->de->persona->nombre_completo)->toBe('Ana Pérez')
        ->and($derivacion->de->persona->relationLoaded('puestoActivo'))->toBeTrue()
        ->and($derivacion->de->persona->puestoActivo->puesto->relationLoaded('area'))->toBeTrue()
        ->and($derivacion->de->persona->puestoActivo->puesto->area->codigo)->toBe($areaDe->codigo)
        ->and($derivacion->a->relationLoaded('persona'))->toBeTrue()
        ->and($derivacion->a->persona->nombre_completo)->toBe('Luis Gómez')
        ->and($derivacion->a->persona->relationLoaded('puestoActivo'))->toBeTrue()
        ->and($derivacion->a->persona->puestoActivo->puesto->relationLoaded('area'))->toBeTrue()
        ->and($derivacion->a->persona->puestoActivo->puesto->area->codigo)->toBe($areaA->codigo);
});
