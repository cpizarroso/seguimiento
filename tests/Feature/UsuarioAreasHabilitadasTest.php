<?php

use App\Models\Persona;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
});

function payloadUsuario(Persona $persona, array $overrides = []): array
{
    return array_merge([
        'name' => 'Usuario de Prueba',
        'email' => 'usuario.prueba@ejemplo.gob.bo',
        'password' => 'secret123',
        'persona_id' => $persona->id,
        'role_ids' => [],
    ], $overrides);
}

it('crea un usuario con areas habilitadas y una predeterminada', function () {
    $persona = Persona::factory()->create();
    $areaA = crearArea('AAA');
    $areaB = crearArea('BBB');

    $this->actingAs($this->admin)->post(route('users.store'), payloadUsuario($persona, [
        'area_ids' => [$areaA->id, $areaB->id],
        'area_predeterminada_id' => $areaB->id,
    ]))->assertRedirect(route('users.index'));

    $user = User::where('email', 'usuario.prueba@ejemplo.gob.bo')->firstOrFail();

    expect($user->areasHabilitadas)->toHaveCount(2)
        ->and($user->areaPredeterminada()->id)->toBe($areaB->id);
});

it('exige que el area predeterminada pertenezca a las areas habilitadas', function () {
    $persona = Persona::factory()->create();
    $areaA = crearArea('AAA');
    $areaB = crearArea('BBB');

    $this->actingAs($this->admin)->post(route('users.store'), payloadUsuario($persona, [
        'area_ids' => [$areaA->id],
        'area_predeterminada_id' => $areaB->id,
    ]))->assertSessionHasErrors('area_predeterminada_id');
});

it('exige un area predeterminada cuando se habilitan areas', function () {
    $persona = Persona::factory()->create();
    $areaA = crearArea('AAA');

    $this->actingAs($this->admin)->post(route('users.store'), payloadUsuario($persona, [
        'area_ids' => [$areaA->id],
    ]))->assertSessionHasErrors('area_predeterminada_id');
});

it('actualiza las areas habilitadas y mueve la predeterminada', function () {
    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id]);
    $areaA = crearArea('AAA');
    $areaB = crearArea('BBB');
    $areaC = crearArea('CCC');

    $user->areasHabilitadas()->sync([$areaA->id => ['predeterminada' => true]]);

    $this->actingAs($this->admin)->put(route('users.update', $user), payloadUsuario($persona, [
        'name' => $user->name,
        'email' => $user->email,
        'password' => '',
        'area_ids' => [$areaB->id, $areaC->id],
        'area_predeterminada_id' => $areaC->id,
    ]))->assertRedirect(route('users.index'));

    $user->refresh()->load('areasHabilitadas');

    expect($user->areasHabilitadas->pluck('id')->all())->toEqualCanonicalizing([$areaB->id, $areaC->id])
        ->and($user->areaPredeterminada()->id)->toBe($areaC->id);
});

it('expone las areas habilitadas en el indice de usuarios', function () {
    $area = crearArea('AAA');
    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id]);
    $user->areasHabilitadas()->sync([$area->id => ['predeterminada' => true]]);

    $this->actingAs($this->admin)->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('users.data', function ($data) use ($user, $area) {
                $row = collect($data)->firstWhere('id', $user->id);

                return $row !== null
                    && in_array($area->id, $row['area_ids'], true)
                    && $row['area_predeterminada_id'] === $area->id;
            }));
});

it('solo muestra las areas habilitadas al crear un tramite', function () {
    $secretaria = Rol::where('slug', 'secretaria')->first();
    $areaHabilitada = crearArea('HAB');
    $areaNoHabilitada = crearArea('OTR');

    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id, 'role' => 'secretaria']);
    $user->roles()->sync([$secretaria->id]);
    $user->areasHabilitadas()->sync([$areaHabilitada->id => ['predeterminada' => true]]);

    $this->actingAs($user)
        ->get(route('tramites.create'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('areas.data', 1)
            ->where('areas.data.0.id', $areaHabilitada->id));

    expect($areaNoHabilitada->id)->not->toBe($areaHabilitada->id);
});

it('restringe la creacion de tramites a las areas habilitadas', function () {
    $secretaria = Rol::where('slug', 'secretaria')->first();
    $areaHabilitada = crearArea('HAB');
    $areaNoHabilitada = crearArea('OTR');

    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id, 'role' => 'secretaria']);
    $user->roles()->sync([$secretaria->id]);
    $user->areasHabilitadas()->sync([$areaHabilitada->id => ['predeterminada' => true]]);

    $this->actingAs($user)
        ->post(route('tramites.store'), [
            'descripcion' => 'No permitido',
            'area_id' => $areaNoHabilitada->id,
        ])
        ->assertSessionHasErrors('area_id');

    $this->actingAs($user)
        ->post(route('tramites.store'), [
            'descripcion' => 'Permitido',
            'area_id' => $areaHabilitada->id,
        ])
        ->assertRedirect();

    expect(Tramite::where('area_id', $areaHabilitada->id)->exists())->toBeTrue();
});

it('un usuario sin areas habilitadas no puede crear tramites', function () {
    $secretaria = Rol::where('slug', 'secretaria')->first();
    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id, 'role' => 'secretaria']);
    $user->roles()->sync([$secretaria->id]);
    $area = crearArea('AAA');

    $this->actingAs($user)
        ->post(route('tramites.store'), [
            'descripcion' => 'Sin áreas',
            'area_id' => $area->id,
        ])
        ->assertSessionHasErrors('area_id');
});

it('permite al admin crear tramites en cualquier area', function () {
    $area = crearArea('ADM');

    $this->actingAs($this->admin)
        ->post(route('tramites.store'), [
            'descripcion' => 'Creado por admin',
            'area_id' => $area->id,
        ])
        ->assertRedirect();

    expect(Tramite::where('area_id', $area->id)->exists())->toBeTrue();
});
