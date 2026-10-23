<?php

use App\Models\Configuracion;
use App\Models\Rol;
use App\Models\User;
use App\Services\ConfiguracionService;

function crearAdminConfiguracion(): User
{
    $user = User::factory()->create();

    $user->roles()->attach(Rol::create([
        'nombre' => 'Administrador',
        'slug' => 'admin',
        'descripcion' => 'Acceso total',
        'es_sistema' => true,
    ]));

    return $user->fresh();
}

it('usa la gestion inicial por defecto y genera las opciones disponibles', function () {
    $service = app(ConfiguracionService::class);

    expect($service->obtenerGestionInicial())->toBe(ConfiguracionService::GESTION_INICIAL_DEFAULT)
        ->and($service->gestionesDisponibles())->toBe(
            range((int) now()->year, ConfiguracionService::GESTION_INICIAL_DEFAULT)
        )
        ->and($service->gestionesConfigurables())->toBe(
            range((int) now()->year, ConfiguracionService::GESTION_MINIMA)
        );
});

it('el administrador puede actualizar la gestion inicial', function () {
    $admin = crearAdminConfiguracion();
    $gestion = (int) now()->year - 1;

    $this->actingAs($admin)
        ->put(route('configuracion.reporte-gestion-inicial'), [
            'gestion_inicial' => $gestion,
        ])
        ->assertRedirect(route('configuracion.index'));

    expect(Configuracion::where('clave', ConfiguracionService::CLAVE_GESTION_INICIAL)->value('valor'))
        ->toBe((string) $gestion);

    expect(app(ConfiguracionService::class)->obtenerGestionInicial())->toBe($gestion);
});

it('el usuario normal no puede actualizar la gestion inicial', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('configuracion.reporte-gestion-inicial'), [
            'gestion_inicial' => (int) now()->year - 1,
        ])
        ->assertForbidden();

    expect(Configuracion::count())->toBe(0);
});

it('rechaza una gestion inicial fuera del rango permitido', function () {
    $admin = crearAdminConfiguracion();

    $this->actingAs($admin)
        ->from(route('configuracion.index'))
        ->put(route('configuracion.reporte-gestion-inicial'), [
            'gestion_inicial' => ConfiguracionService::GESTION_MINIMA - 1,
        ])
        ->assertSessionHasErrors('gestion_inicial');

    $this->actingAs($admin)
        ->from(route('configuracion.index'))
        ->put(route('configuracion.reporte-gestion-inicial'), [
            'gestion_inicial' => (int) now()->year + 1,
        ])
        ->assertSessionHasErrors('gestion_inicial');
});

it('expone la configuracion del reporte solo al administrador', function () {
    $admin = crearAdminConfiguracion();
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->get(route('configuracion.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('puedeConfigurarReporte', true)
            ->where('gestionInicial', ConfiguracionService::GESTION_INICIAL_DEFAULT)
            ->has('gestionesConfigurables')
        );

    $this->actingAs($user)
        ->get(route('configuracion.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('puedeConfigurarReporte', false));
});
