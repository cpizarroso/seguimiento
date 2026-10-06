<?php

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Tramite;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

function crearUsuarioConArea(string $sigla, ?Area $areaExistente = null): array
{
    $area = $areaExistente ?? Area::factory()->create([
        'nombre' => 'Área '.$sigla,
        'sigla' => $sigla,
    ]);
    $funcionario = Funcionario::factory()->create(['area_id' => $area->id]);
    $user = User::factory()->create(['funcionario_id' => $funcionario->id]);

    return [$user, $area];
}

it('sin filtros no genera el documento', function () {
    $user = User::factory()->create();

    $respuesta = $this->actingAs($user)->get(route('reporte.index'));

    $respuesta->assertOk();
    $respuesta->assertInertia(fn ($page) => $page
        ->where('generado', false)
        ->where('reporte.meta.total', 0)
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
    $servicio = app(App\Services\ReporteService::class);

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
        'tramites' => app(App\Services\ReporteService::class)->ingresadosColeccion($area->id, [
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
    expect($historial[0]['total_registros'])->toBe(1);
    expect($historial[0]['url'])->toContain('reporte/descargar');
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
