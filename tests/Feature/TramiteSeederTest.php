<?php

use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
use Database\Seeders\TramiteSeeder;

it('el factory respeta created_at explicito para el seed por fecha', function () {
    $tramite = Tramite::factory()->create(['created_at' => '2026-01-10 08:00:00']);

    expect($tramite->fresh()->created_at->format('Y-m-d H:i'))->toBe('2026-01-10 08:00');
});

it('el seeder crea 15 tramites de hoy en distintos horarios', function () {
    Area::factory()->create(['nombre' => 'Seed Uno', 'sigla' => 'SU']);
    Area::factory()->create(['nombre' => 'Seed Dos', 'sigla' => 'SD']);
    $areaDla = Area::factory()->create(['nombre' => 'Dirección Legal', 'sigla' => 'DLA']);
    User::factory()->count(3)->create();

    $this->seed(TramiteSeeder::class);

    expect(Tramite::count())->toBe(57);

    $deHoy = Tramite::whereDate('created_at', today())->get();

    expect($deHoy)->toHaveCount(15);
    expect($deHoy->map(fn ($t) => $t->created_at->format('H:i:s'))->unique())->toHaveCount(15);
    expect($deHoy->every(fn ($t) => $t->created_at->format('Y-m-d') === $t->fecha->format('Y-m-d')))->toBeTrue();
    expect($deHoy->pluck('area_id')->unique()->all())->toBe([$areaDla->id]);

    $maxIdInicial = Tramite::whereDate('created_at', '<', today())->max('id');
    expect($deHoy->min('id'))->toBeGreaterThan($maxIdInicial);
});
