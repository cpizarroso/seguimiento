<?php

use App\Models\Area;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Services\ConfiguracionService;
use App\Services\ReporteService;
use Illuminate\Support\Facades\Storage;

function crearUsuarioConArea(string $codigo, ?Area $areaExistente = null): array
{
    $area = $areaExistente ?? crearArea($codigo, 'Área '.$codigo);
    [$user] = crearUsuarioConPuesto($area);

    return [$user, $area];
}

it('sin filtros no genera el documento', function () {
    $user = User::factory()->create();

    $respuesta = $this->actingAs($user)->get(route('reporte.index'));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('generado', false)
        ->where('reporte.meta.total', 0)
        ->where('filtros.gestion', (int) now()->year)
        ->where('gestion_actual', (int) now()->year)
        ->has('auth_usuario', fn ($u) => $u->where('id', $user->id)->etc())
    );
});

it('el reporte lista los tramites del area del usuario en el rango', function () {
    [$user, $area] = crearUsuarioConArea('AR');
    [$colega] = crearUsuarioConArea('AR', $area);
    [$externo, $otraArea] = crearUsuarioConArea('OA');

    $dentro = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);
    $delColega = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $colega->id,
        'created_at' => '2026-03-11 08:00:00',
    ]);
    $fueraRango = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-01-05 08:00:00',
    ]);
    $deOtraArea = Tramite::factory()->create([
        'area_id' => $otraArea->id,
        'creado_por' => $externo->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('generado', true)
        ->where('filtros.fecha_desde', '2026-03-01')
        ->where('filtros.fecha_hasta', '2026-03-31')
        ->where('auth_usuario.area_id', $area->id)
    );

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($dentro->id, $delColega->id)
        ->not->toContain($fueraRango->id)
        ->not->toContain($deOtraArea->id);
});

it('por defecto filtra por la gestion actual', function () {
    [$user, $area] = crearUsuarioConArea('GA');

    $actual = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'year' => (int) now()->year,
        'created_at' => '2026-03-10 08:00:00',
    ]);
    $anterior = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'year' => (int) now()->year - 1,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($actual->id)->not->toContain($anterior->id);
});

it('filtra por la gestion seleccionada y permite todas las gestiones', function () {
    app(ConfiguracionService::class)->actualizarGestionInicial(2020);
    [$user, $area] = crearUsuarioConArea('GE');

    $actual = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'year' => (int) now()->year,
        'created_at' => '2026-03-10 08:00:00',
    ]);
    $anterior = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'year' => (int) now()->year - 1,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'gestion' => (int) now()->year - 1,
    ]));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('generado', true)
        ->where('filtros.gestion', (int) now()->year - 1)
    );

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($anterior->id)->not->toContain($actual->id);

    $todas = $this->actingAs($user)->get(route('reporte.index', ['gestion' => 0]));

    $todas->assertOk();
    $todas->assertInertia(fn ($page) => $page
        ->where('filtros.gestion', null)
        ->where('generado', true)
    );

    $propsTodas = $todas->getOriginalContent()->getData()['page']['props'] ?? [];
    $idsTodas = collect($propsTodas['reporte']['data'] ?? [])->pluck('id')->all();

    expect($idsTodas)->toContain($actual->id, $anterior->id);
});

it('rechaza una gestion fuera de las opciones disponibles', function () {
    [$user] = crearUsuarioConArea('GV');

    $this->actingAs($user)
        ->from(route('reporte.index'))
        ->get(route('reporte.index', ['gestion' => ConfiguracionService::GESTION_MINIMA - 1]))
        ->assertSessionHasErrors('gestion');
});

it('el usuario normal no puede cambiar el area del reporte desde la url', function () {
    [$user, $area] = crearUsuarioConArea('NA');
    [, $otraArea] = crearUsuarioConArea('OA');

    $propio = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);
    $ajeno = Tramite::factory()->create([
        'area_id' => $otraArea->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'area_id' => $otraArea->id,
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('puede_seleccionar_area', false)
        ->where('area_reporte.id', $area->id)
        ->where('filtros.area_id', $area->id)
    );

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($propio->id)->not->toContain($ajeno->id);
});

it('el administrador puede seleccionar cualquier area', function () {
    [$admin, $areaAdmin] = crearUsuarioConArea('AD');
    [, $areaExterna] = crearUsuarioConArea('EX');

    $admin->roles()->attach(Rol::create([
        'nombre' => 'Administrador',
        'slug' => 'admin',
        'descripcion' => 'Acceso total',
        'es_sistema' => true,
    ]));

    $tramite = Tramite::factory()->create([
        'area_id' => $areaExterna->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($admin->fresh())->get(route('reporte.index', [
        'area_id' => $areaExterna->id,
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('puede_seleccionar_area', true)
        ->where('area_reporte.id', $areaExterna->id)
        ->where('filtros.area_id', $areaExterna->id)
        ->has('areas.data', 2)
    );

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($tramite->id);
    expect($areaAdmin->id)->not->toBe($areaExterna->id);
});

it('filtra por numero individual, lista, rango y combinacion', function () {
    [, $area] = crearUsuarioConArea('NT');

    foreach ([1, 2, 3, 5, 8, 10, 12] as $numero) {
        Tramite::factory()->create([
            'numero_tramite' => $numero,
            'area_id' => $area->id,
            'created_at' => '2026-03-10 08:00:00',
        ]);
    }

    $service = app(ReporteService::class);
    $numeros = fn (string $expresion) => $service
        ->ingresadosColeccion($area->id, ['numero_tramite' => $expresion])
        ->pluck('numero_tramite')
        ->sort()
        ->values()
        ->all();

    expect($numeros('5'))->toBe([5])
        ->and($numeros('1,3,5'))->toBe([1, 3, 5])
        ->and($numeros('1-3'))->toBe([1, 2, 3])
        ->and($numeros('1-2,8,10-12'))->toBe([1, 2, 8, 10, 12])
        ->and($numeros('5-1'))->toBe([1, 2, 3, 5]);
});

it('genera el reporte solo con un numero de tramite', function () {
    [$user, $area] = crearUsuarioConArea('SN');

    $tramite = Tramite::factory()->create([
        'numero_tramite' => 7,
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'numero_tramite' => '7',
    ]));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page->where('generado', true));

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($tramite->id);
});

it('guardar respeta el area del usuario y el filtro por numero', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('GS');
    [, $otraArea] = crearUsuarioConArea('GO');

    Tramite::factory()->create([
        'numero_tramite' => 7,
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);
    Tramite::factory()->create([
        'numero_tramite' => 8,
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->post(route('reporte.guardar', [
        'area_id' => $otraArea->id,
        'numero_tramite' => '7',
    ]));

    $respuesta->assertRedirect();
    expect($respuesta->getTargetUrl())->toContain('area_id='.$area->id);

    $registro = $user->reportes()->first();

    expect($registro)->not->toBeNull()
        ->and($registro->fecha_desde)->toBeNull()
        ->and($registro->fecha_hasta)->toBeNull()
        ->and($registro->gestion)->toBe((int) now()->year)
        ->and($registro->total_registros)->toBe(1);
});

it('rechaza un formato invalido de numero de tramite', function () {
    [$user] = crearUsuarioConArea('IV');

    $this->actingAs($user)
        ->from(route('reporte.index'))
        ->get(route('reporte.index', ['numero_tramite' => '1-']))
        ->assertSessionHasErrors('numero_tramite');
});

it('el pdf muestra el filtro por numero de tramite', function () {
    $html = view('reportes.tramites-ingresados', [
        'tramites' => collect(),
        'totalRegistros' => 0,
        'fechaDesde' => null,
        'fechaHasta' => null,
        'gestion' => 2025,
        'numeroTramite' => '1-5,8',
        'usuario' => 'Test',
        'area' => 'Área Test',
    ])->render();

    expect($html)->toContain('N° trámite')
        ->toContain('1-5,8')
        ->toContain('Gestión:')
        ->toContain('2025');
});

it('sin area el reporte queda vacio', function () {
    $user = User::factory()->create();

    Tramite::factory()->create(['created_at' => '2026-03-10 08:00:00']);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $total = $props['reporte']['meta']['total'] ?? null;

    expect($total)->toBe(0);
});

it('el filtro hoy limita a la fecha actual', function () {
    [$user, $area] = crearUsuarioConArea('HO');

    $deHoy = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => now()->format('Y-m-d').' 08:00:00',
    ]);
    $viejo = Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => now()->subDays(5)->format('Y-m-d').' 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', ['hoy' => '1']));

    $respuesta->assertOk();

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $ids = collect($props['reporte']['data'] ?? [])->pluck('id')->all();

    expect($ids)->toContain($deHoy->id)->not->toContain($viejo->id);
});

it('el reporte ordena por numero de tramite', function () {
    [$user, $area] = crearUsuarioConArea('OR');

    foreach ([30, 5, 17] as $nro) {
        Tramite::factory()->create([
            'numero_tramite' => $nro,
            'area_id' => $area->id,
            'creado_por' => $user->id,
            'created_at' => '2026-03-10 08:00:00',
        ]);
    }

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $nros = collect($props['reporte']['data'] ?? [])->pluck('numero_tramite')->all();

    expect($nros)->toBe([5, 17, 30]);
});

it('la coleccion del pdf coincide con el paginado de la vista', function () {
    [, $area] = crearUsuarioConArea('CO');

    foreach ([30, 5, 17] as $nro) {
        Tramite::factory()->create([
            'numero_tramite' => $nro,
            'area_id' => $area->id,
            'created_at' => '2026-03-10 08:00:00',
        ]);
    }

    $filtros = ['fecha_desde' => '2026-03-01', 'fecha_hasta' => '2026-03-31', 'per_page' => 100];
    $servicio = app(ReporteService::class);

    $paginados = $servicio->ingresadosPaginados($area->id, $filtros)->getCollection()->pluck('id')->all();
    $coleccion = $servicio->ingresadosColeccion($area->id, $filtros)->pluck('id')->all();

    expect($coleccion)->toBe($paginados);
    expect(Tramite::whereIn('id', $coleccion)->orderBy('numero_tramite')->pluck('numero_tramite')->all())
        ->toBe([5, 17, 30]);
});

it('guardar genera el pdf en el storage', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('GU');

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-04-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->post(route('reporte.guardar', [
        'fecha_desde' => '2026-04-01',
        'fecha_hasta' => '2026-04-30',
    ]));

    $respuesta->assertRedirect();

    $archivos = Storage::disk('local')->files('reportes');
    expect($archivos)->not->toBeEmpty();

    $ruta = $archivos[0];
    expect($ruta)->toContain("reporte-usuario-{$user->id}-");

    $contenido = Storage::disk('local')->get($ruta);
    expect(substr($contenido, 0, 4))->toBe('%PDF');

    $registro = $user->reportes()->first();
    expect($registro)->not->toBeNull()
        ->and($registro->ruta)->toBe($ruta)
        ->and($registro->fecha_desde->toDateString())->toBe('2026-04-01')
        ->and($registro->fecha_hasta->toDateString())->toBe('2026-04-30')
        ->and($registro->hoy)->toBeFalse()
        ->and($registro->total_registros)->toBe(1);
});

it('el pdf usa una sola tabla con encabezado unico', function () {
    [, $area] = crearUsuarioConArea('TH');

    Tramite::factory()->count(5)->create([
        'area_id' => $area->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $html = view('reportes.tramites-ingresados', [
        'tramites' => app(ReporteService::class)->ingresadosColeccion($area->id, [
            'fecha_desde' => '2026-03-01',
            'fecha_hasta' => '2026-03-31',
        ]),
        'totalRegistros' => 5,
        'fechaDesde' => '01/03/2026',
        'fechaHasta' => '31/03/2026',
        'usuario' => 'Test',
        'area' => 'Área Test',
    ])->render();

    expect(substr_count($html, '<thead>'))->toBe(1);
    expect(substr_count($html, '<table>'))->toBe(1);
});

it('generar guarda el pdf temporal para la vista previa', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('VP');

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $respuesta = $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta->assertOk();

    $tmp = "tmp/reportes/reporte-preview-usuario-{$user->id}.pdf";
    expect(Storage::disk('local')->exists($tmp))->toBeTrue();
    expect(substr(Storage::disk('local')->get($tmp), 0, 4))->toBe('%PDF');

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    expect($props['vista_previa_url'] ?? null)->toBe(route('reporte.vista-previa'));
});

it('la vista previa transmite el pdf temporal del usuario', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('VS');

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $respuesta = $this->actingAs($user)->get(route('reporte.vista-previa'));

    $respuesta->assertOk();
    expect($respuesta->headers->get('Content-Type'))->toContain('application/pdf');
});

it('guardar archiva el pdf mostrado en la vista previa', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('VG');

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $tmp = "tmp/reportes/reporte-preview-usuario-{$user->id}.pdf";
    $bytesPrevios = Storage::disk('local')->get($tmp);

    $this->actingAs($user)->post(route('reporte.guardar', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]))->assertRedirect();

    expect(Storage::disk('local')->exists($tmp))->toBeFalse();

    $registro = $user->reportes()->first();
    expect($registro)->not->toBeNull();
    expect(Storage::disk('local')->get($registro->ruta))->toBe($bytesPrevios);
});

function piesDelPdf(string $bytes): array
{
    preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $bytes, $m);
    $pies = [];
    foreach ($m[1] as $s) {
        foreach ([$s, @gzinflate($s), @gzuncompress($s)] as $cand) {
            if (! is_string($cand)) {
                continue;
            }
            preg_match_all('/\(((?:[^()\\\\]|\\\\.)*)\)/', $cand, $mm);
            foreach ($mm[1] as $t) {
                if (preg_match('/gina (\d+) de (\d+)/', stripcslashes($t), $n)) {
                    $pies[] = [(int) $n[1], (int) $n[2]];
                }
            }
        }
    }

    return $pies;
}

it('el pie muestra el numero correcto en cada pagina', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('PP');

    Tramite::factory()->count(60)->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-03-10 08:00:00',
    ]);

    $this->actingAs($user)->get(route('reporte.index', [
        'fecha_desde' => '2026-03-01',
        'fecha_hasta' => '2026-03-31',
    ]));

    $bytes = Storage::disk('local')->get("tmp/reportes/reporte-preview-usuario-{$user->id}.pdf");
    $pies = piesDelPdf($bytes);
    $total = count($pies);

    expect($total)->toBeGreaterThan(1);
    expect(array_column($pies, 0))->toBe(range(1, $total));
    expect(array_values(array_unique(array_column($pies, 1))))->toBe([$total]);
});

it('el index expone el historial de reportes guardados', function () {
    Storage::fake('local');
    [$user, $area] = crearUsuarioConArea('HI');

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'created_at' => '2026-05-10 08:00:00',
    ]);

    $this->actingAs($user)->post(route('reporte.guardar', [
        'fecha_desde' => '2026-05-01',
        'fecha_hasta' => '2026-05-31',
    ]));

    $respuesta = $this->actingAs($user)->get(route('reporte.index'));

    $respuesta->assertOk();

    $props = $respuesta->getOriginalContent()->getData()['page']['props'] ?? [];
    $historial = $props['historial'] ?? [];

    expect($historial)->toHaveCount(1);
    expect($historial[0]['gestion'])->toBe((int) now()->year);
    expect($historial[0]['total_registros'])->toBe(1);
    expect($historial[0]['url'])->toContain('reporte/descargar');
});

it('guarda la gestion seleccionada en el historial', function () {
    Storage::fake('local');
    app(ConfiguracionService::class)->actualizarGestionInicial(2020);
    [$user, $area] = crearUsuarioConArea('HG');

    $gestion = (int) now()->year - 1;

    Tramite::factory()->create([
        'area_id' => $area->id,
        'creado_por' => $user->id,
        'year' => $gestion,
        'created_at' => '2026-05-10 08:00:00',
    ]);

    $this->actingAs($user)
        ->post(route('reporte.guardar', ['gestion' => $gestion]))
        ->assertRedirect();

    $registro = $user->reportes()->first();

    expect($registro)->not->toBeNull()
        ->and($registro->gestion)->toBe($gestion)
        ->and($registro->total_registros)->toBe(1);
});

it('al guardar todas las gestiones conserva el filtro en la redireccion', function () {
    Storage::fake('local');
    [$user] = crearUsuarioConArea('TG');

    $respuesta = $this->actingAs($user)
        ->post(route('reporte.guardar', ['gestion' => 0]));

    $respuesta->assertRedirect();
    expect($respuesta->getTargetUrl())->toContain('gestion=0');

    $registro = $user->reportes()->first();

    expect($registro)->not->toBeNull()
        ->and($registro->gestion)->toBeNull();
});

it('descargar rechaza archivos de otro usuario', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    $otro = User::factory()->create();

    Storage::disk('local')->put('reportes/reporte-usuario-999-20260101-000000.pdf', 'falso');

    $this->actingAs($user)
        ->get(route('reporte.descargar', ['archivo' => 'reportes/reporte-usuario-999-20260101-000000.pdf']))
        ->assertNotFound();

    $this->actingAs($otro)
        ->get(route('reporte.descargar', ['archivo' => '../.env']))
        ->assertNotFound();
});
