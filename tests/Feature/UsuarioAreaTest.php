<?php

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Puesto;
use App\Models\User;
use App\Models\UserPuesto;

it('comparte el area del funcionario del usuario autenticado', function () {
    $area = Area::factory()->create(['nombre' => 'Dirección de Prueba', 'sigla' => 'DPR']);
    $funcionario = Funcionario::factory()->create(['area_id' => $area->id]);
    $user = User::factory()->create(['funcionario_id' => $funcionario->id]);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.area', 'Dirección de Prueba')
            ->where('auth.user.area_id', $area->id));
});

it('usa el area del puesto activo cuando no tiene funcionario', function () {
    $area = Area::factory()->create(['nombre' => 'Área del Puesto', 'sigla' => 'APU']);
    $puesto = Puesto::factory()->create(['area_id' => $area->id, 'nombre' => 'Puesto de Prueba']);
    $user = User::factory()->create(['funcionario_id' => null]);
    UserPuesto::create([
        'user_id' => $user->id,
        'puesto_id' => $puesto->id,
        'fecha_inicio' => now()->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.user.area', 'Área del Puesto'));
});

it('el area es nula cuando no tiene funcionario ni puesto', function () {
    $user = User::factory()->create(['funcionario_id' => null]);

    $this->actingAs($user)
        ->get(route('tramites.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.user.area', null));
});
