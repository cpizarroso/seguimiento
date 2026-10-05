<?php

use App\Models\Actuacion;
use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Permiso;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create(['name' => 'Admin', 'email' => 'admin@test.com']);
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($this->admin);
});

function usuarioConPermiso(string $rolSlug, ?string $modulo = 'tramites', ?string $accion = 'edicion'): User
{
    $user = User::factory()->create();
    $rol = Rol::firstOrCreate(['slug' => $rolSlug], ['nombre' => ucfirst($rolSlug)]);

    $ids = [];

    if ($modulo && $accion) {
        $permiso = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', $modulo))
            ->whereHas('accion', fn ($q) => $q->where('slug', $accion))
            ->firstOrFail();
        $ids[] = $permiso->id;
    }

    $rol->permisos()->sync($ids);
    $user->roles()->sync([$rol->id]);

    return $user->fresh();
}

it('el administrador accede a la edicion de un tramite', function () {
    $tramite = Tramite::factory()->create();

    $this->get(route('tramites.edit', $tramite))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Tramites/Edit'));
});

it('un rol con permiso tramites.edicion accede a la edicion', function () {
    $tramite = Tramite::factory()->create();
    $editor = usuarioConPermiso('editor');

    $this->actingAs($editor)
        ->get(route('tramites.edit', $tramite))
        ->assertOk();
});

it('un rol sin permiso tramites.edicion no accede a la edicion', function () {
    $tramite = Tramite::factory()->create();
    $consultor = usuarioConPermiso('consultor-tramites', 'tramites', 'consulta');

    $this->actingAs($consultor)
        ->get(route('tramites.edit', $tramite))
        ->assertForbidden();
});

it('un rol sin permiso tramites.edicion no puede actualizar el tramite', function () {
    $tramite = Tramite::factory()->create();
    $consultor = usuarioConPermiso('consultor-tramites', 'tramites', 'consulta');

    $this->actingAs($consultor)
        ->put(route('tramites.update', $tramite), [
            'descripcion' => 'Cambio no autorizado',
            'area_id' => $tramite->area_id,
        ])
        ->assertForbidden();

    expect($tramite->fresh()->descripcion)->not->toBe('Cambio no autorizado');
});

it('actualiza los datos editables del tramite y redirige al detalle', function () {
    $areaOrigen = Area::factory()->create();
    $areaDestino = Area::factory()->create();
    $tramite = Tramite::factory()->create([
        'area_id' => $areaOrigen->id,
        'descripcion' => 'Descripción original',
        'numero_diamante' => null,
        'urgente' => false,
    ]);

    $response = $this->put(route('tramites.update', $tramite), [
        'descripcion' => 'Descripción editada',
        'numero_diamante' => 'D-9999',
        'area_id' => $areaDestino->id,
        'urgente' => true,
    ]);

    $response->assertRedirect(route('tramites.show', $tramite));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('tramites', [
        'id' => $tramite->id,
        'descripcion' => 'Descripción editada',
        'numero_diamante' => 'D-9999',
        'area_id' => $areaDestino->id,
        'urgente' => true,
    ]);
});

it('exige descripcion y area al editar un tramite', function () {
    $tramite = Tramite::factory()->create();

    $this->put(route('tramites.update', $tramite), [])
        ->assertSessionHasErrors(['descripcion', 'area_id']);
});

it('el indice entrega la ultima actuacion de cada tramite', function () {
    $funcionario = Funcionario::factory()->create();
    $tramite = Tramite::factory()->create();
    $derivacion = $tramite->crearPrimeraDerivacion();

    Actuacion::create([
        'derivacion_id' => $derivacion->id,
        'area_id' => $tramite->area_id,
        'funcionario_id' => $funcionario->id,
        'glosa' => 'Primera actuación',
        'fecha_actuacion' => now()->subDays(3),
    ]);

    $ultima = Actuacion::create([
        'derivacion_id' => $derivacion->id,
        'area_id' => $tramite->area_id,
        'funcionario_id' => $funcionario->id,
        'glosa' => 'Actuación más reciente',
        'fecha_actuacion' => now()->subHour(),
    ]);

    $response = $this->get(route('tramites.index'));

    $response->assertOk()->assertInertia(fn ($page) => $page
        ->component('Tramites/Index')
        ->where('tramites.data.0.id', $tramite->id)
        ->where('tramites.data.0.actuaciones.0.id', $ultima->id)
        ->where('tramites.data.0.actuaciones.0.glosa', 'Actuación más reciente')
    );
});

it('el listado de tramites incluye actuaciones vacias sin romper la tabla', function () {
    Tramite::factory()->create();

    $this->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tramites.data.0.actuaciones', []));
});
