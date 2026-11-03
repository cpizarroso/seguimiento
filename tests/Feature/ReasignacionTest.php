<?php

use App\Models\Area;
use App\Models\Reasignacion;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Services\DerivacionService;
use Database\Seeders\PermisosReasignacionesSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function usuarioReasignacion(string $slug, Area $area): User
{
    [$user] = crearUsuarioConPuesto($area);

    $rol = Rol::firstOrCreate(
        ['slug' => $slug],
        ['nombre' => ucfirst($slug), 'descripcion' => '', 'es_sistema' => true],
    );

    $user->roles()->syncWithoutDetaching([$rol->id]);

    return $user->fresh();
}

beforeEach(function () {
    $this->area = crearArea('DLA');
    $this->holder = usuarioReasignacion('user', $this->area);
    $this->solicitante = usuarioReasignacion('user', $this->area);
    $this->jefe = usuarioReasignacion('jefe', $this->area);
    $this->admin = usuarioReasignacion('admin', $this->area);

    $this->seed(PermisosReasignacionesSeeder::class);

    // El observer crea la primera derivación (recepcionada al creador).
    $this->tramite = Tramite::factory()->proceso()->create([
        'area_id' => $this->area->id,
        'creado_por' => $this->holder->id,
        'derivado_a' => $this->holder->id,
    ]);
});

it('registra una solicitud de reasignación para un trámite ajeno', function () {
    $this->actingAs($this->solicitante)
        ->post(route('reasignaciones.store'), [
            'tramite_id' => $this->tramite->id,
            'motivo' => 'Necesito revisar el expediente completo',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $reasignacion = Reasignacion::first();

    expect($reasignacion)->not->toBeNull()
        ->and($reasignacion->estado)->toBe(Reasignacion::ESTADO_PENDIENTE)
        ->and((int) $reasignacion->solicitante_id)->toBe($this->solicitante->id)
        ->and($reasignacion->motivo)->toBe('Necesito revisar el expediente completo');
});

it('no permite dos solicitudes pendientes para el mismo trámite', function () {
    $datos = ['tramite_id' => $this->tramite->id, 'motivo' => 'Primera solicitud válida'];

    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), $datos)
        ->assertSessionHasNoErrors();

    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), $datos)
        ->assertSessionHasErrors('tramite_id');

    expect(Reasignacion::count())->toBe(1);
});

it('no permite solicitar un trámite finalizado', function () {
    $this->tramite->update(['estado' => 'finalizado']);

    $this->actingAs($this->solicitante)
        ->post(route('reasignaciones.store'), [
            'tramite_id' => $this->tramite->id,
            'motivo' => 'Quiero revisarlo de todos modos',
        ])
        ->assertSessionHasErrors('tramite_id');

    expect(Reasignacion::count())->toBe(0);
});

it('no permite solicitar un trámite que el usuario ya tiene recepcionado', function () {
    $this->actingAs($this->holder)
        ->post(route('reasignaciones.store'), [
            'tramite_id' => $this->tramite->id,
            'motivo' => 'Quiero que me lo reasignen igual',
        ])
        ->assertSessionHasErrors('tramite_id');

    expect(Reasignacion::count())->toBe(0);
});

it('aprueba la solicitud con una derivación recepcionada y deja derivar al solicitante', function () {
    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), [
        'tramite_id' => $this->tramite->id,
        'motivo' => 'Necesito continuar la tramitación',
    ]);

    $reasignacion = Reasignacion::firstOrFail();

    $this->actingAs($this->jefe)
        ->put(route('reasignaciones.aprobar', $reasignacion), ['glosa_respuesta' => 'Adelante'])
        ->assertRedirect()
        ->assertSessionHas('success');

    $reasignacion->refresh();
    $tramite = $this->tramite->fresh();
    $ultima = $tramite->derivaciones()->reorder('numero_derivacion', 'desc')->first();

    expect($reasignacion->estado)->toBe(Reasignacion::ESTADO_APROBADA)
        ->and($reasignacion->resuelto_por_id)->toBe($this->jefe->id)
        ->and($reasignacion->derivacion_id)->toBe($ultima->id)
        ->and($tramite->derivado_a)->toBe($this->solicitante->id)
        ->and($tramite->estado)->toBe('proceso')
        ->and($ultima->estado)->toBe('recepcionado')
        ->and($ultima->derivado_a)->toBe($this->solicitante->id)
        ->and($ultima->fecha_recepcion)->not->toBeNull()
        ->and(app(DerivacionService::class)->puedeDerivar($tramite, (int) $this->solicitante->id))->toBeTrue();
});

it('rechaza las demás solicitudes pendientes al aprobar una', function () {
    $otro = usuarioReasignacion('user', $this->area);

    $primera = Reasignacion::create([
        'tramite_id' => $this->tramite->id,
        'solicitante_id' => $this->solicitante->id,
        'motivo' => 'Primera solicitud',
        'estado' => Reasignacion::ESTADO_PENDIENTE,
    ]);

    $segunda = Reasignacion::create([
        'tramite_id' => $this->tramite->id,
        'solicitante_id' => $otro->id,
        'motivo' => 'Segunda solicitud',
        'estado' => Reasignacion::ESTADO_PENDIENTE,
    ]);

    $this->actingAs($this->admin)
        ->put(route('reasignaciones.aprobar', $primera), ['glosa_respuesta' => ''])
        ->assertRedirect();

    expect($primera->fresh()->estado)->toBe(Reasignacion::ESTADO_APROBADA)
        ->and($segunda->fresh()->estado)->toBe(Reasignacion::ESTADO_RECHAZADA)
        ->and($segunda->fresh()->glosa_respuesta)->toContain('otra solicitud aprobada');
});

it('rechazar una solicitud no modifica el trámite', function () {
    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), [
        'tramite_id' => $this->tramite->id,
        'motivo' => 'Solicitud que será rechazada',
    ]);

    $reasignacion = Reasignacion::firstOrFail();
    $antes = $this->tramite->fresh()->only(['derivado_a', 'estado']);

    $this->actingAs($this->jefe)
        ->put(route('reasignaciones.rechazar', $reasignacion), ['glosa_respuesta' => 'No corresponde'])
        ->assertRedirect();

    expect($reasignacion->fresh()->estado)->toBe(Reasignacion::ESTADO_RECHAZADA)
        ->and($this->tramite->fresh()->only(['derivado_a', 'estado']))->toBe($antes);
});

it('solo el solicitante puede cancelar su solicitud pendiente', function () {
    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), [
        'tramite_id' => $this->tramite->id,
        'motivo' => 'Solicitud a cancelar',
    ]);

    $reasignacion = Reasignacion::firstOrFail();

    $this->actingAs($this->holder)
        ->delete(route('reasignaciones.cancelar', $reasignacion))
        ->assertSessionHasErrors('solicitante');

    expect($reasignacion->fresh()->estado)->toBe(Reasignacion::ESTADO_PENDIENTE);

    $this->actingAs($this->solicitante)
        ->delete(route('reasignaciones.cancelar', $reasignacion))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($reasignacion->fresh()->estado)->toBe(Reasignacion::ESTADO_CANCELADA);
});

it('impide resolver solicitudes a usuarios sin permiso de resolución', function () {
    $reasignacion = Reasignacion::create([
        'tramite_id' => $this->tramite->id,
        'solicitante_id' => $this->solicitante->id,
        'motivo' => 'Solicitud pendiente',
        'estado' => Reasignacion::ESTADO_PENDIENTE,
    ]);

    $this->actingAs($this->solicitante)
        ->put(route('reasignaciones.aprobar', $reasignacion))
        ->assertForbidden();

    expect($reasignacion->fresh()->estado)->toBe(Reasignacion::ESTADO_PENDIENTE);
});

it('muestra al usuario común solo sus propias solicitudes', function () {
    $otro = usuarioReasignacion('user', $this->area);
    $otroTramite = Tramite::factory()->proceso()->create([
        'area_id' => $this->area->id,
        'creado_por' => $otro->id,
        'derivado_a' => $otro->id,
    ]);

    Reasignacion::create([
        'tramite_id' => $this->tramite->id,
        'solicitante_id' => $this->solicitante->id,
        'motivo' => 'Mía',
        'estado' => Reasignacion::ESTADO_PENDIENTE,
    ]);

    Reasignacion::create([
        'tramite_id' => $otroTramite->id,
        'solicitante_id' => $otro->id,
        'motivo' => 'Ajena',
        'estado' => Reasignacion::ESTADO_PENDIENTE,
    ]);

    $this->actingAs($this->solicitante)
        ->get(route('reasignaciones.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Reasignaciones/Index')
            ->has('reasignaciones.data', 1)
            ->where('puede_resolver', false)
        );

    $this->actingAs($this->jefe)
        ->get(route('reasignaciones.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('reasignaciones.data', 2)
            ->where('puede_resolver', true)
        );
});

it('bloquea el módulo a usuarios sin permiso de consulta', function () {
    $sinRol = User::factory()->create();

    $this->actingAs($sinRol)->get(route('reasignaciones.index'))->assertForbidden();
});

it('expone la solicitud pendiente en el detalle del trámite', function () {
    $this->actingAs($this->solicitante)->post(route('reasignaciones.store'), [
        'tramite_id' => $this->tramite->id,
        'motivo' => 'Solicitud visible en el detalle',
    ]);

    $reasignacion = Reasignacion::firstOrFail();

    $this->actingAs($this->solicitante)
        ->get(route('tramites.show', $this->tramite))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Tramites/Show')
            ->where('reasignacion_pendiente.id', $reasignacion->id)
            ->where('reasignacion_pendiente.motivo', 'Solicitud visible en el detalle')
        );
});
