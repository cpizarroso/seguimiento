<?php

use App\Models\Area;
use App\Models\Derivacion;
use App\Models\Funcionario;
use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use App\Services\DerivacionService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
});

function editor(): User
{
    $user = User::factory()->create();
    $rol = Rol::firstOrCreate(['slug' => 'editor-actuaciones'], ['nombre' => 'Editor actuaciones']);
    $permiso = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', 'tramites'))
        ->whereHas('accion', fn ($q) => $q->where('slug', 'edicion'))
        ->firstOrFail();
    $rol->permisos()->sync([$permiso->id]);
    $user->roles()->sync([$rol->id]);

    return $user->fresh();
}

function payloadActuacion(): array
{
    return [
        'glosa' => 'Actuación de prueba',
    ];
}

it('permite actuar sobre una derivacion recepcionada por el usuario', function () {
    $editor = editor();
    $funcionario = Funcionario::factory()->create();
    $editor->update(['funcionario_id' => $funcionario->id]);
    $area = Area::factory()->create(['nombre' => 'Act '.uniqid(), 'sigla' => 'ACT']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite para actuar',
        'area_id' => $area->id,
    ], $editor->id);

    $derivacion = $tramite->derivaciones()->firstOrFail();

    $this->actingAs($editor)
        ->post(route('actuaciones.store', $derivacion), payloadActuacion())
        ->assertRedirect(route('tramites.show', $tramite));

    $this->assertDatabaseHas('actuaciones', [
        'derivacion_id' => $derivacion->id,
        'glosa' => 'Actuación de prueba',
        'area_id' => $area->id,
        'funcionario_id' => $funcionario->id,
    ]);
});

it('niega actuar sobre una derivacion de otro usuario', function () {
    $editor = editor();
    $otro = editor();
    $area = Area::factory()->create(['nombre' => 'Act2 '.uniqid(), 'sigla' => 'AC2']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite ajeno',
        'area_id' => $area->id,
    ], $otro->id);

    $derivacion = $tramite->derivaciones()->firstOrFail();

    $this->actingAs($editor)
        ->post(route('actuaciones.store', $derivacion), payloadActuacion())
        ->assertForbidden();
});

it('niega actuar sobre una derivacion historica', function () {
    $editor = editor();
    $destino = editor();
    $area = Area::factory()->create(['nombre' => 'Act3 '.uniqid(), 'sigla' => 'AC3']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite con historial',
        'area_id' => $area->id,
    ], $editor->id);

    $primera = $tramite->derivaciones()->firstOrFail();
    app(DerivacionService::class)->derivar($tramite->fresh(), $destino->id, 'Derivo');

    expect($primera->fresh()->estado)->toBe('historico');

    $this->actingAs($editor)
        ->post(route('actuaciones.store', $primera), payloadActuacion())
        ->assertForbidden();
});

it('niega actuar sobre una derivacion aun no recepcionada', function () {
    $editor = editor();
    $destino = editor();
    $area = Area::factory()->create(['nombre' => 'Act4 '.uniqid(), 'sigla' => 'AC4']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite derivado sin recepcion',
        'area_id' => $area->id,
    ], $editor->id);

    $segunda = app(DerivacionService::class)->derivar($tramite, $destino->id, 'Derivo sin recepcion');

    expect($segunda->estado)->toBe('derivado');

    $this->actingAs($destino)
        ->post(route('actuaciones.store', $segunda), payloadActuacion())
        ->assertForbidden();
});

it('niega actuar en un tramite finalizado aunque la derivacion sea propia', function () {
    $editor = editor();
    $area = Area::factory()->create(['nombre' => 'Act5 '.uniqid(), 'sigla' => 'AC5']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite a finalizar',
        'area_id' => $area->id,
    ], $editor->id);
    $tramite->update(['estado' => 'finalizado']);

    $derivacion = $tramite->derivaciones()->firstOrFail();

    $this->actingAs($editor)
        ->post(route('actuaciones.store', $derivacion), payloadActuacion())
        ->assertForbidden();
});

it('el servicio rechaza actuar sobre derivacion historica', function () {
    $editor = editor();
    $destino = editor();
    $area = Area::factory()->create(['nombre' => 'Act6 '.uniqid(), 'sigla' => 'AC6']);
    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Trámite servicio',
        'area_id' => $area->id,
    ], $editor->id);

    $primera = $tramite->derivaciones()->firstOrFail();
    app(DerivacionService::class)->derivar($tramite->fresh(), $destino->id, 'Derivo');

    expect(fn () => app(App\Services\ActuacionService::class)->crear($primera->fresh(), payloadActuacion(), $editor->id))
        ->toThrow(InvalidArgumentException::class);
});
