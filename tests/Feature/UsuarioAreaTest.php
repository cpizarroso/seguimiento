<?php

use App\Models\Persona;
use App\Models\User;

it('comparte el area del puesto vigente de la persona del usuario', function () {
    $area = crearArea('DPR', 'Dirección de Prueba');
    [$user] = crearUsuarioConPuesto($area);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.area', 'Dirección de Prueba')
            ->where('auth.user.area_id', $area->id)
            ->where('auth.user.persona_id', $user->persona_id));
});

it('el area es nula cuando la persona no tiene puesto vigente', function () {
    $persona = Persona::factory()->create();
    $user = User::factory()->create(['persona_id' => $persona->id]);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.user.area', null));
});

it('el area es nula cuando el usuario no tiene persona', function () {
    $user = User::factory()->create(['persona_id' => null]);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.user.area', null));
});
