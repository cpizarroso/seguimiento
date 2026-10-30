<?php

use App\Models\Area;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Services\DerivacionService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
});

function asignarRolEdicion(User $user): User
{
    $rol = Rol::where('slug', 'secretaria')->firstOrFail();
    $user->roles()->sync([$rol->id]);

    return $user->fresh();
}

function crearEditorConPuesto(?Area $area = null): array
{
    $area ??= crearArea('ED'.uniqid());

    $persona = crearPersonaConPuesto($area);
    $user = User::factory()->create(['persona_id' => $persona->id]);

    return [asignarRolEdicion($user), $persona, $area];
}

function crearTramiteDerivacion(User $creador, Area $area, string $descripcion = 'Trámite de prueba'): Tramite
{
    return app(TramiteService::class)->crear([
        'descripcion' => $descripcion,
        'area_id' => $area->id,
    ], $creador->id);
}

it('expone el destino de la ultima derivacion en el index', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    crearTramiteDerivacion($editor, $areaEditor);

    $puesto = $editor->persona->puestoActivo->puesto;

    $this->actingAs($editor)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tramites/Index')
            ->where('tramites.data.0.derivaciones.0.estado', 'recepcionado')
            ->where('tramites.data.0.derivaciones.0.derivado_a.id', $editor->id)
            ->where('tramites.data.0.derivaciones.0.derivado_a.persona.area.codigo', $areaEditor->codigo)
            ->where('tramites.data.0.derivaciones.0.derivado_a.persona.puesto_activo.puesto.nombre', $puesto->nombre)
        );
});

it('expone los destinatarios con puesto vigente en el detalle', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $tramite = crearTramiteDerivacion($editor, $areaEditor);

    $this->actingAs($editor)
        ->get(route('tramites.show', $tramite))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tramites/Show')
            ->has('destinatarios', 1)
            ->where('destinatarios.0.user_id', $destino->id)
            ->where('destinatarios.0.area_id', $areaDestino->id)
        );
});

it('permite derivar un tramite recepcionado a una persona del area elegida', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $tramite = crearTramiteDerivacion($editor, $areaEditor);

    $this->actingAs($editor)
        ->post(route('tramites.derivar', $tramite), [
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
            'glosa_derivacion' => 'Derivación de prueba',
        ])
        ->assertRedirect(route('tramites.show', $tramite));

    $tramite->refresh();
    $ultima = $tramite->derivaciones()->reorder('numero_derivacion', 'desc')->first();

    expect($tramite->derivado_a)->toBe($destino->id)
        ->and($tramite->estado)->toBe('proceso')
        ->and($tramite->derivaciones()->count())->toBe(2)
        ->and($ultima->derivado_a)->toBe($destino->id)
        ->and($ultima->estado)->toBe('derivado')
        ->and($ultima->glosa_derivacion)->toBe('Derivación de prueba');
});

it('rechaza derivar a una persona que no pertenece al area elegida', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));
    $otraArea = crearArea('OT'.uniqid());

    $tramite = crearTramiteDerivacion($editor, $areaEditor);

    $this->actingAs($editor)
        ->post(route('tramites.derivar', $tramite), [
            'area_id' => $otraArea->id,
            'derivado_a' => $destino->id,
        ])
        ->assertSessionHasErrors('derivado_a');

    expect($tramite->fresh()->derivaciones()->count())->toBe(1);
});

it('rechaza derivarse a si mismo', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    $tramite = crearTramiteDerivacion($editor, $areaEditor);

    $this->actingAs($editor)
        ->post(route('tramites.derivar', $tramite), [
            'area_id' => $areaEditor->id,
            'derivado_a' => $editor->id,
        ])
        ->assertSessionHasErrors('derivado_a');
});

it('no permite derivar un tramite que aun no fue recepcionado', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));
    [$nuevoDestino, , $nuevaArea] = crearUsuarioConPuesto(crearArea('ND'.uniqid()));

    $tramite = crearTramiteDerivacion($editor, $areaEditor);
    app(DerivacionService::class)->derivar($tramite, $destino->id, 'Sin recepcionar');

    $this->actingAs($destino)
        ->post(route('tramites.derivar', $tramite->fresh()), [
            'area_id' => $nuevaArea->id,
            'derivado_a' => $nuevoDestino->id,
        ])
        ->assertForbidden();
});

it('permite derivar varios tramites a la vez', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $tramites = collect([
        crearTramiteDerivacion($editor, $areaEditor, 'Trámite masivo 1'),
        crearTramiteDerivacion($editor, $areaEditor, 'Trámite masivo 2'),
        crearTramiteDerivacion($editor, $areaEditor, 'Trámite masivo 3'),
    ]);

    $this->actingAs($editor)
        ->from(route('tramites.index'))
        ->post(route('tramites.derivar-varios'), [
            'tramite_ids' => $tramites->pluck('id')->all(),
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
            'glosa_derivacion' => 'Derivación masiva',
        ])
        ->assertRedirect(route('tramites.index'));

    foreach ($tramites as $tramite) {
        $tramite->refresh();
        $ultima = $tramite->derivaciones()->reorder('numero_derivacion', 'desc')->first();

        expect($tramite->derivado_a)->toBe($destino->id)
            ->and($tramite->derivaciones()->count())->toBe(2)
            ->and($ultima->derivado_a)->toBe($destino->id)
            ->and($ultima->glosa_derivacion)->toBe('Derivación masiva');
    }
});

it('rechaza toda la derivacion masiva si un tramite no es derivable', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));
    [$otroUsuario, , $otraArea] = crearEditorConPuesto();

    $propio = crearTramiteDerivacion($editor, $areaEditor, 'Propio');
    $ajeno = crearTramiteDerivacion($otroUsuario, $otraArea, 'Ajeno');

    $this->actingAs($editor)
        ->from(route('tramites.index'))
        ->post(route('tramites.derivar-varios'), [
            'tramite_ids' => [$propio->id, $ajeno->id],
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
        ])
        ->assertSessionHasErrors('tramite_ids');

    expect($propio->fresh()->derivaciones()->count())->toBe(1)
        ->and($ajeno->fresh()->derivaciones()->count())->toBe(1);
});

it('exige al menos un tramite en la derivacion masiva', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $this->actingAs($editor)
        ->from(route('tramites.index'))
        ->post(route('tramites.derivar-varios'), [
            'tramite_ids' => [],
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
        ])
        ->assertSessionHasErrors('tramite_ids');
});

it('niega derivar a un usuario sin permiso de edicion', function () {
    $persona = crearPersonaConPuesto(crearArea('SP'.uniqid()));
    $usuario = User::factory()->create(['persona_id' => $persona->id]);
    $area = $persona->puestoActivo->puesto->area;
    $tramite = crearTramiteDerivacion($usuario, $area);
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $this->actingAs($usuario)
        ->post(route('tramites.derivar', $tramite), [
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
        ])
        ->assertForbidden();
});

it('permite observar con area y destino validos', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino, , $areaDestino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));

    $tramite = crearTramiteDerivacion($editor, $areaEditor);
    $tramite->update(['estado' => 'proceso']);

    $this->actingAs($editor)
        ->put(route('tramites.update-estado', $tramite), [
            'estado' => 'observado',
            'area_id' => $areaDestino->id,
            'derivado_a' => $destino->id,
            'glosa_observacion' => 'Observación de prueba',
        ])
        ->assertRedirect(route('tramites.show', $tramite));

    $tramite->refresh();
    $ultima = $tramite->derivaciones()->reorder('numero_derivacion', 'desc')->first();

    expect($tramite->estado)->toBe('observado')
        ->and($tramite->derivado_a)->toBe($destino->id)
        ->and($ultima->glosa_derivacion)->toBe('Observación de prueba');
});

it('rechaza observar hacia una persona de otra area', function () {
    [$editor, , $areaEditor] = crearEditorConPuesto();
    [$destino] = crearUsuarioConPuesto(crearArea('DS'.uniqid()));
    $otraArea = crearArea('OT'.uniqid());

    $tramite = crearTramiteDerivacion($editor, $areaEditor);
    $tramite->update(['estado' => 'proceso']);

    $this->actingAs($editor)
        ->put(route('tramites.update-estado', $tramite), [
            'estado' => 'observado',
            'area_id' => $otraArea->id,
            'derivado_a' => $destino->id,
            'glosa_observacion' => 'Observación inválida',
        ])
        ->assertSessionHasErrors('derivado_a');
});
