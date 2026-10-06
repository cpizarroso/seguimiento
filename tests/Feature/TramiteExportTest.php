<?php

use App\Exports\TramitesExport;
use App\Models\Tramite;
use App\Models\User;
use App\Services\TramiteService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

function tramiteCreadoAyer(): Tramite
{
    $tramite = Tramite::factory()->create();

    DB::table('tramites')->where('id', $tramite->id)->update([
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    return $tramite->fresh();
}

it('el filtro hoy muestra solo los tramites creados hoy', function () {
    $deHoy = Tramite::factory()->create();
    $deAyer = tramiteCreadoAyer();

    $ids = app(TramiteService::class)->listar(['hoy' => '1'])->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deHoy->id)->not->toContain($deAyer->id);
});

it('sin el filtro hoy el listado incluye tramites de otros dias', function () {
    $deHoy = Tramite::factory()->create();
    $deAyer = tramiteCreadoAyer();

    $ids = app(TramiteService::class)->listar()->getCollection()->pluck('id')->all();

    expect($ids)->toContain($deHoy->id, $deAyer->id);
});

it('la exportacion respeta el filtro hoy', function () {
    $deHoy = Tramite::factory()->create();
    $deAyer = tramiteCreadoAyer();

    $todas = app(TramitesExport::class, ['filtros' => []])->collection();
    $soloHoy = app(TramitesExport::class, ['filtros' => ['hoy' => '1']])->collection();

    expect($todas->pluck('id')->all())->toContain($deHoy->id, $deAyer->id);
    expect($soloHoy->pluck('id')->all())->toContain($deHoy->id)->not->toContain($deAyer->id);
});

it('la ruta de exportar descarga un xlsx', function () {
    Tramite::factory()->create();

    $response = $this->get(route('tramites.export'));

    $response->assertOk();
    $response->assertHeader(
        'content-type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect($response->headers->get('content-disposition'))->toContain('.xlsx');
});

it('el excel tiene las columnas esperadas y dias numerico', function () {
    $user = User::factory()->create();
    Tramite::factory()->create(['creado_por' => $user->id, 'derivado_a' => $user->id]);

    $export = app(TramitesExport::class, ['filtros' => []]);

    expect($export->headings())->toBe([
        'N° Trámite',
        'Urgente',
        'Fecha creación',
        'N° Diamante',
        'Área',
        'Descripción',
        'Días',
        'Estado',
    ]);

    $fila = $export->map($export->collection()->first());

    expect($fila)->toHaveCount(8);
    expect($fila[6])->toBeInt();
});

it('exporta 0 en dias cuando el tramite es de hoy', function () {
    Tramite::factory()->create();

    Excel::store(new TramitesExport(app(TramiteService::class), []), 'test-cero.xlsx');

    $sheet = IOFactory::load(Storage::disk('local')->path('test-cero.xlsx'))->getActiveSheet();

    expect($sheet->getCell('G2')->getValue())->toBe(0);

    Storage::disk('local')->delete('test-cero.xlsx');
});
