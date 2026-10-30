<?php

use App\Models\Persona;
use App\Models\Permiso;
use App\Models\Rol;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);

    $this->admin = User::factory()->create();
    $this->admin->roles()->sync([Rol::where('slug', 'admin')->firstOrFail()->id]);
});

function permisoIdPorSlug(string $modulo, string $accion): int
{
    return (int) Permiso::query()
        ->whereHas('modulo', fn ($q) => $q->where('slug', $modulo))
        ->whereHas('accion', fn ($q) => $q->where('slug', $accion))
        ->value('id');
}

function payloadUsuarioConPermisos(Persona $persona, array $permisos = []): array
{
    return [
        'username' => 'permisos.'.uniqid(),
        'email' => 'permisos.'.uniqid().'@ejemplo.gob.bo',
        'password' => 'secret123',
        'persona_id' => $persona->id,
        'role_ids' => [],
        'permisos' => $permisos,
    ];
}

it('guarda un override de concesion al crear un usuario', function () {
    $persona = Persona::factory()->create();
    $permisoId = permisoIdPorSlug('usuarios', 'edicion');

    $this->actingAs($this->admin)
        ->post(route('users.store'), payloadUsuarioConPermisos($persona, [
            ['permiso_id' => $permisoId, 'permitido' => true],
        ]))
        ->assertRedirect(route('users.index'));

    $creado = User::where('persona_id', $persona->id)->firstOrFail();

    $this->assertDatabaseHas('permiso_user', [
        'user_id' => $creado->id,
        'permiso_id' => $permisoId,
        'permitido' => true,
    ]);

    expect($creado->fresh()->hasPermission('usuarios', 'edicion'))->toBeTrue();
});

it('actualiza el override a denegado', function () {
    $persona = Persona::factory()->create();
    $permisoId = permisoIdPorSlug('tramites', 'tramitacion');

    $usuario = User::factory()->create(['persona_id' => $persona->id]);
    $usuario->permisosDirectos()->attach($permisoId, ['permitido' => true]);

    $this->actingAs($this->admin)
        ->put(route('users.update', $usuario), [
            ...payloadUsuarioConPermisos($persona),
            'username' => $usuario->username,
            'email' => $usuario->email,
            'permisos' => [
                ['permiso_id' => $permisoId, 'permitido' => false],
            ],
        ])
        ->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('permiso_user', [
        'user_id' => $usuario->id,
        'permiso_id' => $permisoId,
        'permitido' => false,
    ]);

    expect($usuario->fresh()->hasPermission('tramites', 'tramitacion'))->toBeFalse();
});

it('limpia los overrides cuando se envia la lista vacia', function () {
    $persona = Persona::factory()->create();
    $permisoId = permisoIdPorSlug('usuarios', 'edicion');

    $usuario = User::factory()->create(['persona_id' => $persona->id]);
    $usuario->permisosDirectos()->attach($permisoId, ['permitido' => true]);

    $this->actingAs($this->admin)
        ->put(route('users.update', $usuario), [
            ...payloadUsuarioConPermisos($persona),
            'username' => $usuario->username,
            'email' => $usuario->email,
            'permisos' => [],
        ])
        ->assertRedirect(route('users.index'));

    $this->assertDatabaseMissing('permiso_user', [
        'user_id' => $usuario->id,
        'permiso_id' => $permisoId,
    ]);
});

it('impide que un admin se quite a si mismo la edicion de usuarios', function () {
    $persona = crearPersonaConPuesto(crearArea('AU'.uniqid()));
    $this->admin->update(['persona_id' => $persona->id]);
    $permisoId = permisoIdPorSlug('usuarios', 'edicion');

    $this->actingAs($this->admin->fresh())
        ->put(route('users.update', $this->admin), [
            'username' => $this->admin->username,
            'email' => $this->admin->email,
            'persona_id' => $persona->id,
            'role_ids' => [Rol::where('slug', 'admin')->firstOrFail()->id],
            'permisos' => [
                ['permiso_id' => $permisoId, 'permitido' => false],
            ],
        ])
        ->assertSessionHasErrors('permisos.0.permitido');

    $this->assertDatabaseMissing('permiso_user', [
        'user_id' => $this->admin->id,
        'permiso_id' => $permisoId,
    ]);
});

it('permite guardar overrides propios que no bloquean el acceso', function () {
    $persona = crearPersonaConPuesto(crearArea('AU'.uniqid()));
    $this->admin->update(['persona_id' => $persona->id]);
    $permisoId = permisoIdPorSlug('usuarios', 'baja');

    $this->actingAs($this->admin->fresh())
        ->put(route('users.update', $this->admin), [
            'username' => $this->admin->username,
            'email' => $this->admin->email,
            'persona_id' => $persona->id,
            'role_ids' => [Rol::where('slug', 'admin')->firstOrFail()->id],
            'permisos' => [
                ['permiso_id' => $permisoId, 'permitido' => true],
            ],
        ])
        ->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('permiso_user', [
        'user_id' => $this->admin->id,
        'permiso_id' => $permisoId,
        'permitido' => true,
    ]);
});
