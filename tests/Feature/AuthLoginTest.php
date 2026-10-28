<?php

use App\Models\Persona;
use App\Models\User;

it('inicia sesion con el email de acceso', function () {
    $user = User::factory()->create([
        'email' => 'acceso@ejemplo.gob.bo',
        'password' => 'secreto123',
    ]);

    $this->post('/login', [
        'login' => 'acceso@ejemplo.gob.bo',
        'password' => 'secreto123',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('inicia sesion con el username', function () {
    $user = User::factory()->create([
        'username' => 'ana.perez',
        'email' => 'ana.perez@ejemplo.gob.bo',
        'password' => 'secreto123',
    ]);

    $this->post('/login', [
        'login' => 'ana.perez',
        'password' => 'secreto123',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('inicia sesion con la parte local del correo institucional', function () {
    $user = User::factory()->create([
        'username' => 'otro.usuario',
        'email' => 'erodriguez@'.config('app.user_domain'),
        'password' => 'secreto123',
    ]);

    $this->post('/login', [
        'login' => 'erodriguez',
        'password' => 'secreto123',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('rechaza credenciales invalidas', function () {
    User::factory()->create([
        'username' => 'valido',
        'password' => 'secreto123',
    ]);

    $this->post('/login', [
        'login' => 'valido',
        'password' => 'incorrecta',
    ])->assertSessionHasErrors('login');

    $this->assertGuest();
});

it('genera el username desde el email al crear el usuario', function () {
    $persona = Persona::factory()->create();

    $user = User::create([
        'email' => 'Nuevo.Usuario@ejemplo.gob.bo',
        'password' => 'secreto123',
        'persona_id' => $persona->id,
    ]);

    expect($user->username)->toBe('nuevo.usuario')
        ->and($user->nombre_completo)->toBe($persona->nombre_completo);
});
