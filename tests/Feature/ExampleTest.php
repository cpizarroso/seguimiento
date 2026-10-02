<?php

use App\Models\User;

it('redirige la raiz al listado de tramites', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/')->assertRedirect(route('tramites.index'));
});

it('redirige la raiz al login cuando no hay sesion', function () {
    $this->get('/')->assertRedirect(route('login'));
});
