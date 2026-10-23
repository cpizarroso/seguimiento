<?php

use App\Models\Area;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature', 'Unit');

function crearArea(string $codigo, ?string $nombre = null, ?Area $padre = null): Area
{
    return Area::factory()->create([
        'nombre' => $nombre ?? 'Área '.$codigo,
        'codigo' => $codigo,
        'area_padre_id' => $padre?->id,
    ]);
}

function crearPersonaConPuesto(?Area $area = null, ?Puesto $puesto = null, array $personaAttrs = []): Persona
{
    $area ??= Area::factory()->create();

    $puesto ??= Puesto::factory()->create([
        'area_id' => $area->id,
        'activo' => true,
    ]);

    $persona = Persona::factory()->create($personaAttrs);

    PersonaPuesto::create([
        'persona_id' => $persona->id,
        'puesto_id' => $puesto->id,
        'fecha_inicio' => now()->toDateString(),
        'fecha_fin' => null,
    ]);

    return $persona->fresh();
}

function crearUsuarioConPuesto(?Area $area = null, array $userAttrs = [], array $personaAttrs = []): array
{
    $persona = crearPersonaConPuesto($area, null, $personaAttrs);

    $user = User::factory()->create([
        'persona_id' => $persona->id,
        ...$userAttrs,
    ]);

    return [$user, $persona, $persona->puestoActivo->puesto->area];
}
