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

it('el seeder crea 50 tramites de hoy para erodriguez', function () {
    $areaDla = Area::factory()->create(['nombre' => 'Dirección Legal', 'sigla' => 'DLA']);
    $erodriguez = User::factory()->create(['email' => 'erodriguez@'.config('app.user_domain')]);

    $this->seed(TramiteSeeder::class);

    expect(Tramite::count())->toBe(107);

    $deHoy = Tramite::whereDate('created_at', today())->get();

    expect($deHoy)->toHaveCount(65);
    expect($deHoy->every(fn ($t) => $t->creado_por === $erodriguez->id))->toBeTrue();
    expect($deHoy->every(fn ($t) => $t->created_at->format('Y-m-d') === $t->fecha->format('Y-m-d')))->toBeTrue();
    expect($deHoy->pluck('area_id')->unique()->all())->toBe([$areaDla->id]);

    // La Fase 3 corre al final: los 50 últimos ids son los de erodriguez,
    // con horarios escalonados distintos entre sí.
    $fase3 = Tramite::orderByDesc('id')->limit(50)->get();

    expect($fase3->every(fn ($t) => $t->creado_por === $erodriguez->id))->toBeTrue();
    expect($fase3->map(fn ($t) => $t->created_at->format('H:i:s'))->unique())->toHaveCount(50);
});

it('crearParaUsuario crea la cantidad pedida para el usuario indicado', function () {
    Area::factory()->create(['nombre' => 'Dirección Legal', 'sigla' => 'DLA']);
    $user = User::factory()->create();
    $otro = User::factory()->create();

    app(TramiteSeeder::class)->crearParaUsuario($user, 3);

    $propios = Tramite::where('creado_por', $user->id)->get();

    expect($propios)->toHaveCount(3);
    expect($propios->every(fn ($t) => $t->created_at->isToday()))->toBeTrue();
    expect(Tramite::where('creado_por', $otro->id)->count())->toBe(0);
});

it('crearParaUsuario resuelve el usuario por login sin dominio', function () {
    Area::factory()->create(['nombre' => 'Dirección Legal', 'sigla' => 'DLA']);
    $user = User::factory()->create(['email' => 'erodriguez@'.config('app.user_domain')]);

    app(TramiteSeeder::class)->crearParaUsuario('erodriguez', 2);

    expect(Tramite::where('creado_por', $user->id)->count())->toBe(2);
});
