<?php

use App\Models\Derivacion;
use App\Models\Tramite;
use App\Models\User;
use App\Services\ImportacionDocumentosDlaService;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Genera una planilla mínima con la misma estructura de "DOCUMENTOS RECIB DLA".
 *
 * @param  list<array<int, mixed>>  $filas
 */
function crearPlanillaDla(array $filas): string
{
    $libro = new Spreadsheet;
    $hoja = $libro->getActiveSheet();
    $hoja->setTitle(ImportacionDocumentosDlaService::HOJA);

    $hoja->fromArray([
        'NRO', 'FECHA', 'DESCRIPCION', 'DERIVADO A.', 'RAO-91',
        'DERIVACION 2', 'DERIVACION 3', 'DERIVACION 4', 'DERIVACION 5',
    ], null, 'A1');

    $hoja->fromArray($filas, null, 'A2');

    $ruta = tempnam(sys_get_temp_dir(), 'dla').'.xlsx';
    (new Xlsx($libro))->save($ruta);

    return $ruta;
}

beforeEach(function () {
    crearArea('DLA');
    crearArea('COM');
    User::factory()->create(['email' => 'importacion@'.config('app.user_domain')]);
});

it('importa las filas manteniendo la numeracion de la planilla', function () {
    $archivo = crearPlanillaDla([
        [1, 46161, 'PRIMER DOCUMENTO', 'A. ABOG X EL 19/05/2026', 'SES2-1/2026', null, null, null, null],
        [2, '30/07/206', 'SEGUNDO DOCUMENTO', 'REMITIO A DRU CON CI DLA Nº 12/2026', null, 'REMITIO A DOT', null, null, null],
    ]);

    $reporte = app(ImportacionDocumentosDlaService::class)->importar($archivo);

    expect($reporte['tramites'])->toBe(2);

    $primero = Tramite::where('numero_tramite', 1)->firstOrFail();

    expect($primero->numero_completo)->toBe('DLA-0001/2026')
        ->and($primero->fecha->format('Y-m-d'))->toBe('2026-05-19')
        ->and($primero->descripcion)->toContain('PRIMER DOCUMENTO')
        ->and($primero->descripcion)->toContain('RAO-91: SES2-1/2026')
        ->and($primero->estado)->toBe('finalizado');

    $segundo = Tramite::where('numero_tramite', 2)->firstOrFail();

    expect($segundo->fecha->format('Y-m-d'))->toBe('2026-07-30');
});

it('renumera los duplicados y guarda el nro original en el diamante', function () {
    $archivo = crearPlanillaDla([
        [6, 46161, 'ORIGINAL', null, null, null, null, null, null],
        [6, 46161, 'REPETIDO', null, null, null, null, null, null],
    ]);

    $reporte = app(ImportacionDocumentosDlaService::class)->importar($archivo);

    expect($reporte['duplicados'])->toBe(1);

    $repetido = Tramite::where('descripcion', 'REPETIDO')->firstOrFail();

    expect($repetido->numero_tramite)->toBe(7)
        ->and($repetido->numero_diamante)->toBe('6')
        ->and($repetido->numero_completo)->toBe('DLA-0007/2026');
});

it('completa fecha y descripcion en las filas sin datos', function () {
    $archivo = crearPlanillaDla([
        [1098, null, null, null, null, null, null, null, null],
    ]);

    $reporte = app(ImportacionDocumentosDlaService::class)->importar($archivo);

    $tramite = Tramite::where('numero_tramite', 1098)->firstOrFail();

    expect($reporte['sin_datos'])->toBe(1)
        ->and($tramite->fecha->format('Y-m-d'))->toBe('2026-01-01')
        ->and($tramite->descripcion)->toBe('sin datos');
});

it('numera los S/N con el contador y deja el original como diamante', function () {
    $archivo = crearPlanillaDla([
        [3, 46161, 'TERCERO', null, null, null, null, null, null],
        ['S/N', 46161, 'SIN NUMERO', null, null, null, null, null, null],
    ]);

    app(ImportacionDocumentosDlaService::class)->importar($archivo);

    $sinNumero = Tramite::where('descripcion', 'SIN NUMERO')->firstOrFail();

    expect($sinNumero->numero_tramite)->toBe(4)
        ->and($sinNumero->numero_diamante)->toBe('S/N');
});

it('arma la cadena de derivaciones con y sin fecha', function () {
    $archivo = crearPlanillaDla([
        [1, 46161, 'CON DERIVACIONES', 'A. ABOG X EL 19/05/2026', null, 'REMITIO A DOT', 'OTRA SIN FECHA', null, null],
    ]);

    app(ImportacionDocumentosDlaService::class)->importar($archivo);

    $tramite = Tramite::where('numero_tramite', 1)->firstOrFail();
    $derivaciones = Derivacion::where('tramite_id', $tramite->id)
        ->orderBy('numero_derivacion')
        ->get();

    expect($derivaciones)->toHaveCount(3)
        ->and($derivaciones[0]->fecha_derivacion->format('Y-m-d'))->toBe('2026-05-19')
        ->and($derivaciones[0]->estado)->toBe('recepcionado')
        ->and($derivaciones[0]->glosa_derivacion)->toBe('A. ABOG X EL 19/05/2026')
        ->and($derivaciones[1]->fecha_derivacion->format('Y-m-d'))->toBe('1970-01-01')
        ->and($derivaciones[1]->estado)->toBe('derivado')
        ->and($tramite->estado)->toBe('proceso');
});

it('no permite repetir la importacion sin forzar', function () {
    $archivo = crearPlanillaDla([
        [1, 46161, 'UNO', null, null, null, null, null, null],
    ]);

    $servicio = app(ImportacionDocumentosDlaService::class);
    $servicio->importar($archivo);

    expect(fn () => $servicio->importar($archivo))->toThrow(RuntimeException::class);
});
