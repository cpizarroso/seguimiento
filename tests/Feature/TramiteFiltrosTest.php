<?php

use App\Exports\TramitesExport;
use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use App\Services\TramiteService;
use Illuminate\Support\Facades\DB;

it('el filtro area_id muestra solo los tramites de esa area', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Uno', 'codigo' => 'F1']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Dos', 'codigo' => 'F2']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar(['area_id' => (string) $areaA->id])->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deA->id)->not->toContain($deB->id);
});

it('sin filtro de area el listado incluye todas las areas', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Tres', 'codigo' => 'F3']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Cuatro', 'codigo' => 'F4']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramiteService::class)->listar()->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deA->id, $deB->id);
});

it('la exportacion respeta el filtro de area', function () {
    $user = User::factory()->create();
    $areaA = Area::factory()->create(['nombre' => 'Filtro Cinco', 'codigo' => 'F5']);
    $areaB = Area::factory()->create(['nombre' => 'Filtro Seis', 'codigo' => 'F6']);

    $deA = Tramite::factory()->create(['area_id' => $areaA->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $deB = Tramite::factory()->create(['area_id' => $areaB->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    $ids = app(TramitesExport::class, ['filtros' => ['area_id' => (string) $areaA->id]])->collection()->pluck('id')->all();

    expect($ids)->toContain($deA->id)->not->toContain($deB->id);
});

it('filtra por numero de tramite parcial y por numero completo', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Numeración '.uniqid(), 'codigo' => 'NUM']);

    $tramite = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_tramite' => 1234,
        'year' => 2026,
    ]);
    $otro = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_tramite' => 5678,
        'year' => 2026,
    ]);

    $service = app(TramiteService::class);

    expect($service->listar(['numero_tramite' => '234'])->getCollection()->pluck('id')->all())
        ->toContain($tramite->id)
        ->not->toContain($otro->id);

    expect($service->listar(['numero_tramite' => 'NUM-1234'])->getCollection()->pluck('id')->all())
        ->toContain($tramite->id)
        ->not->toContain($otro->id);
});

it('filtra por numero de diamante y descripcion de forma parcial', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Texto '.uniqid(), 'codigo' => 'TXT']);

    $tramite = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_diamante' => 'DIA-7777',
        'descripcion' => 'Solicitud de licencia especial',
    ]);
    $otro = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_diamante' => 'DIA-8888',
        'descripcion' => 'Certificado de antecedentes',
    ]);

    $service = app(TramiteService::class);

    expect($service->listar(['numero_diamante' => '777'])->getCollection()->pluck('id')->all())
        ->toContain($tramite->id)
        ->not->toContain($otro->id);

    expect($service->listar(['descripcion' => 'licencia'])->getCollection()->pluck('id')->all())
        ->toContain($tramite->id)
        ->not->toContain($otro->id);
});

it('filtra por fecha incluyendo todo el dia seleccionado', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Fechas '.uniqid(), 'codigo' => 'FEC']);

    $inicioDelDia = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $finDelDia = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $diaSiguiente = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    DB::table('tramites')->where('id', $inicioDelDia->id)->update(['fecha' => '2026-10-23 00:00:00']);
    DB::table('tramites')->where('id', $finDelDia->id)->update(['fecha' => '2026-10-23 23:59:59']);
    DB::table('tramites')->where('id', $diaSiguiente->id)->update(['fecha' => '2026-10-24 00:00:00']);

    $ids = app(TramiteService::class)
        ->listar(['fecha_desde' => '2026-10-23', 'fecha_hasta' => '2026-10-23'])
        ->getCollection()
        ->pluck('id')
        ->all();

    expect($ids)->toContain($inicioDelDia->id, $finDelDia->id)
        ->not->toContain($diaSiguiente->id);
});

it('permite rangos de fecha abiertos y normaliza un rango invertido', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Rangos '.uniqid(), 'codigo' => 'RNG']);

    $diaAnterior = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $dia = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);
    $diaSiguiente = Tramite::factory()->create(['area_id' => $area->id, 'creado_por' => $user->id, 'derivado_a' => $user->id]);

    DB::table('tramites')->where('id', $diaAnterior->id)->update(['fecha' => '2026-10-22 23:59:59']);
    DB::table('tramites')->where('id', $dia->id)->update(['fecha' => '2026-10-23 12:00:00']);
    DB::table('tramites')->where('id', $diaSiguiente->id)->update(['fecha' => '2026-10-24 00:00:00']);

    $service = app(TramiteService::class);

    $desde = $service->listar(['fecha_desde' => '2026-10-23'])->getCollection()->pluck('id')->all();
    expect($desde)->toContain($dia->id, $diaSiguiente->id)->not->toContain($diaAnterior->id);

    $hasta = $service->listar(['fecha_hasta' => '2026-10-23'])->getCollection()->pluck('id')->all();
    expect($hasta)->toContain($diaAnterior->id, $dia->id)->not->toContain($diaSiguiente->id);

    $invertido = $service->listar(['fecha_desde' => '2026-10-24', 'fecha_hasta' => '2026-10-23'])
        ->getCollection()
        ->pluck('id')
        ->all();
    expect($invertido)->toContain($dia->id, $diaSiguiente->id)->not->toContain($diaAnterior->id);
});

it('la exportacion respeta los filtros separados', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Export '.uniqid(), 'codigo' => 'EXP']);

    $incluido = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_diamante' => 'DIA-4545',
        'descripcion' => 'Licencia de funcionamiento',
    ]);
    $excluido = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
        'numero_diamante' => 'DIA-9090',
        'descripcion' => 'Registro de propiedad',
    ]);

    $ids = app(TramitesExport::class, [
        'filtros' => ['numero_diamante' => '454', 'descripcion' => 'funcionamiento'],
    ])->collection()->pluck('id')->all();

    expect($ids)->toContain($incluido->id)->not->toContain($excluido->id);
});

it('filtra por el estado de recepcion de la ultima derivacion', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Recepción '.uniqid(), 'codigo' => 'REC']);

    $porRecepcionar = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $porRecepcionar->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now(),
        'glosa_derivacion' => 'Pendiente de recepción',
        'fecha_recepcion' => null,
        'estado' => 'derivado',
    ]);

    $recepcionado = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $recepcionado->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now()->subHour(),
        'glosa_derivacion' => 'Recepción completada',
        'fecha_recepcion' => now(),
        'estado' => 'recepcionado',
    ]);

    $service = app(TramiteService::class);

    $pendientes = $service->listar(['recepcion' => 'por_recepcionar'])->getCollection()->pluck('id')->all();
    expect($pendientes)->toContain($porRecepcionar->id)->not->toContain($recepcionado->id);

    $recibidos = $service->listar(['recepcion' => 'recepcionados'])->getCollection()->pluck('id')->all();
    expect($recibidos)->toContain($recepcionado->id)->not->toContain($porRecepcionar->id);

    $todos = $service->listar(['recepcion' => 'todos'])->getCollection()->pluck('id')->all();
    expect($todos)->toContain($porRecepcionar->id, $recepcionado->id);
});

it('la exportacion respeta el filtro de recepcion', function () {
    $user = User::factory()->create();
    $area = Area::factory()->create(['nombre' => 'Export recepción '.uniqid(), 'codigo' => 'EXR']);

    $pendiente = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);
    $pendiente->derivaciones()->create([
        'numero_derivacion' => 2,
        'derivado_de' => $user->id,
        'derivado_a' => $user->id,
        'fecha_derivacion' => now(),
        'glosa_derivacion' => 'Pendiente de recepción',
        'estado' => 'derivado',
    ]);

    $recibido = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'derivado_a' => $user->id,
    ]);

    $ids = app(TramitesExport::class, [
        'filtros' => ['recepcion' => 'por_recepcionar'],
    ])->collection()->pluck('id')->all();

    expect($ids)->toContain($pendiente->id)->not->toContain($recibido->id);
});
