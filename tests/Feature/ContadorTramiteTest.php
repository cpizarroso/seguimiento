<?php

use App\Models\Area;
use App\Models\Rol;
use App\Models\User;
use App\Services\ContadorTramiteService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);

    $this->admin = User::factory()->create(['email' => 'admin-contador@test.com']);
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

it('mantiene secuencias independientes por area y por gestion', function () {
    $legal = Area::factory()->create(['nombre' => 'Legal '.uniqid(), 'codigo' => 'DLA']);
    $tecnica = Area::factory()->create(['nombre' => 'Técnica '.uniqid(), 'codigo' => 'DTE']);

    $service = app(ContadorTramiteService::class);

    expect($service->siguienteNumero($legal->id, 2026))->toBe(1)
        ->and($service->siguienteNumero($legal->id, 2026))->toBe(2)
        ->and($service->siguienteNumero($tecnica->id, 2026))->toBe(1)
        ->and($service->siguienteNumero($legal->id, 2027))->toBe(1);
});

it('reinicia el contador y registra la glosa', function () {
    $area = Area::factory()->create(['nombre' => 'Reinicio '.uniqid(), 'codigo' => 'DRE']);
    $service = app(ContadorTramiteService::class);

    $service->siguienteNumero($area->id, 2026);
    $service->siguienteNumero($area->id, 2026);

    $contador = $service->reiniciar($area->id, 'Cambio de gestión', 2026);

    expect($contador->ultimo_numero)->toBe(0)
        ->and($contador->reset_glosa)->toBe('Cambio de gestión')
        ->and($contador->ultimo_reset_at)->not->toBeNull()
        ->and($service->siguienteNumero($area->id, 2026))->toBe(1);
});

it('usa la secuencia del area y el formato codigo-0000-gestion al crear', function () {
    $area = Area::factory()->create(['nombre' => 'Creación '.uniqid(), 'codigo' => 'DCR']);
    $creador = User::factory()->create();

    $service = app(TramiteService::class);

    $primero = $service->crear(['descripcion' => 'Primer trámite', 'area_id' => $area->id], $creador->id);
    $segundo = $service->crear(['descripcion' => 'Segundo trámite', 'area_id' => $area->id], $creador->id);

    expect($primero->numero_tramite)->toBe(1)
        ->and($primero->numero_completo)->toBe(sprintf('DCR-0001/%d', now()->year))
        ->and($segundo->numero_tramite)->toBe(2)
        ->and($segundo->numero_completo)->toBe(sprintf('DCR-0002/%d', now()->year));
});

it('redirige a configuracion al reiniciar el contador', function () {
    $area = Area::factory()->create(['nombre' => 'Config '.uniqid(), 'codigo' => 'DCF']);
    $service = app(ContadorTramiteService::class);

    $service->siguienteNumero($area->id, now()->year);

    $this->post(route('contador.reiniciar'), [
        'area_id' => $area->id,
        'glosa' => 'Reinicio desde configuración',
    ])->assertRedirect(route('configuracion.index'));

    expect($service->obtenerContador($area->id, now()->year)?->ultimo_numero)->toBe(0);
});
