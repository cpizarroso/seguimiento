<?php

use App\Models\Area;
use App\Models\Rol;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\RolesYPermisosSeeder;

beforeEach(function () {
    $this->seed(RolesYPermisosSeeder::class);
    $admin = User::factory()->create(['email' => 'admin-numcomp@test.com']);
    $admin->roles()->sync([Rol::where('slug', 'admin')->first()->id]);
    $this->actingAs($admin);
});

it('autocompleta numero_completo al crear un tramite', function () {
    $area = Area::factory()->create(['nombre' => 'Legal '.uniqid(), 'sigla' => 'DLA']);

    $tramite = Tramite::factory()->create([
        'area_id' => $area->id,
        'numero_tramite' => 7,
        'year' => 2026,
    ]);

    expect($tramite->fresh()->numero_completo)->toBe('DLA-7/2026');
});

it('recalcula numero_completo al cambiar el tramite de area', function () {
    $origen = Area::factory()->create(['nombre' => 'Origen '.uniqid(), 'sigla' => 'DLA']);
    $destino = Area::factory()->create(['nombre' => 'Destino '.uniqid(), 'sigla' => 'DOT']);

    $tramite = Tramite::factory()->create([
        'area_id' => $origen->id,
        'numero_tramite' => 12,
        'year' => 2026,
    ]);

    expect($tramite->fresh()->numero_completo)->toBe('DLA-12/2026');

    $tramite->update(['area_id' => $destino->id]);

    expect($tramite->fresh()->numero_completo)->toBe('DOT-12/2026');
});

it('rellena numero_completo al guardar una fila legacy sin valor', function () {
    $area = Area::factory()->create(['nombre' => 'Migrada '.uniqid(), 'sigla' => 'DRU']);

    $id = DB::table('tramites')->insertGetId([
        'numero_tramite' => 3,
        'year' => 2025,
        'fecha' => now(),
        'descripcion' => 'Trámite sin numero_completo',
        'estado' => 'iniciado',
        'area_id' => $area->id,
        'creado_por' => \App\Models\User::factory()->create()->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Simula fila previa a la migración y la regenera como el backfill
    DB::table('tramites')->where('id', $id)->update(['numero_completo' => null]);

    $tramite = Tramite::findOrFail($id);
    $tramite->save();

    expect($tramite->fresh()->numero_completo)->toBe('DRU-3/2025');
});

it('encuentra tramites buscando por numero_completo', function () {
    $area = Area::factory()->create(['nombre' => 'Busq '.uniqid(), 'sigla' => 'DLA']);
    $tramite = Tramite::factory()->create([
        'area_id' => $area->id,
        'numero_tramite' => 42,
        'year' => 2026,
    ]);

    $this->get(route('tramites.index', ['search' => $tramite->fresh()->numero_completo]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('tramites.data', 1));
});
