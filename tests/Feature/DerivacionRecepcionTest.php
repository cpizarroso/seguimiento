<?php

use App\Models\Area;
use App\Models\Permiso;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use App\Services\DerivacionService;
use App\Services\TramiteService;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
});

function crearUsuarioConRol(string $slug, ?Area $area = null): array
{
    $area ??= crearArea('RC'.uniqid());
    $persona = crearPersonaConPuesto($area);
    $user = User::factory()->create(['persona_id' => $persona->id]);
    $user->roles()->sync([Rol::where('slug', $slug)->firstOrFail()->id]);

    return [$user->fresh(), $area];
}

function tramiteDerivadoA(User $destino, Area $area): Tramite
{
    $creador = User::factory()->create();

    $tramite = app(TramiteService::class)->crear([
        'descripcion' => 'Recepción '.uniqid(),
        'area_id' => $area->id,
    ], $creador->id);

    app(DerivacionService::class)->derivar($tramite, $destino->id, 'Pendiente de recepción');

    return $tramite->fresh();
}

function ultimaDerivacion(Tramite $tramite)
{
    return $tramite->derivaciones()->reorder('numero_derivacion', 'desc')->first();
}

it('permite a un usuario con rol user recepcionar un tramite derivado', function () {
    [$usuario, $area] = crearUsuarioConRol('user');
    $tramite = tramiteDerivadoA($usuario, $area);

    $this->actingAs($usuario)
        ->from(route('tramites.index'))
        ->post(route('tramites.recepcionar-varios'), [
            'tramite_ids' => [$tramite->id],
            'glosa_recepcion' => 'Recibido en ventanilla',
        ])
        ->assertRedirect(route('tramites.index'));

    $ultima = ultimaDerivacion($tramite);

    expect($ultima->estado)->toBe('recepcionado')
        ->and($ultima->glosa_recepcion)->toBe('Recibido en ventanilla');
});

it('recepciona varios tramites a la vez', function () {
    [$usuario, $area] = crearUsuarioConRol('user');

    $tramites = collect([
        tramiteDerivadoA($usuario, $area),
        tramiteDerivadoA($usuario, $area),
    ]);

    $this->actingAs($usuario)
        ->from(route('tramites.index'))
        ->post(route('tramites.recepcionar-varios'), [
            'tramite_ids' => $tramites->pluck('id')->all(),
            'glosa_recepcion' => 'Recepción masiva',
        ])
        ->assertRedirect(route('tramites.index'));

    foreach ($tramites as $tramite) {
        $ultima = ultimaDerivacion($tramite->fresh());

        expect($ultima->estado)->toBe('recepcionado')
            ->and($ultima->glosa_recepcion)->toBe('Recepción masiva');
    }
});

it('rechaza toda la recepcion masiva si un tramite no esta pendiente', function () {
    [$usuario, $area] = crearUsuarioConRol('user');
    [$otro] = crearUsuarioConRol('user');

    $pendiente = tramiteDerivadoA($usuario, $area);
    $ajeno = tramiteDerivadoA($otro, crearArea('AJ'.uniqid()));

    $this->actingAs($usuario)
        ->from(route('tramites.index'))
        ->post(route('tramites.recepcionar-varios'), [
            'tramite_ids' => [$pendiente->id, $ajeno->id],
        ])
        ->assertSessionHasErrors('tramite_ids');

    expect(ultimaDerivacion($pendiente->fresh())->estado)->toBe('derivado')
        ->and(ultimaDerivacion($ajeno->fresh())->estado)->toBe('derivado');
});

it('exige al menos un tramite en la recepcion masiva', function () {
    [$usuario] = crearUsuarioConRol('user');

    $this->actingAs($usuario)
        ->from(route('tramites.index'))
        ->post(route('tramites.recepcionar-varios'), [
            'tramite_ids' => [],
        ])
        ->assertSessionHasErrors('tramite_ids');
});

it('deniega la recepcion cuando el permiso tramitacion esta denegado', function () {
    [$usuario, $area] = crearUsuarioConRol('user');
    $tramite = tramiteDerivadoA($usuario, $area);

    $permiso = Permiso::whereHas('modulo', fn ($q) => $q->where('slug', 'tramites'))
        ->whereHas('accion', fn ($q) => $q->where('slug', 'tramitacion'))
        ->firstOrFail();

    $usuario->permisosDirectos()->attach($permiso->id, ['permitido' => false]);

    $this->actingAs($usuario->fresh())
        ->post(route('tramites.recepcionar-varios'), [
            'tramite_ids' => [$tramite->id],
        ])
        ->assertForbidden();

    expect(ultimaDerivacion($tramite->fresh())->estado)->toBe('derivado');
});

it('expone los destinatarios de derivacion a un usuario con rol user', function () {
    [$usuario, $area] = crearUsuarioConRol('user');
    crearUsuarioConPuesto(crearArea('DS'.uniqid()));
    $tramite = tramiteDerivadoA($usuario, $area);

    $this->actingAs($usuario)
        ->get(route('tramites.show', $tramite))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tramites/Show')
            ->has('destinatarios', 1)
        );
});
