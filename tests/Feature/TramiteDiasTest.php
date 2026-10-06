<?php

use App\Models\Tramite;
use Illuminate\Support\Facades\DB;

it('los dias se calculan desde created_at aunque la fecha sea hoy', function () {
    $tramite = Tramite::factory()->create(['fecha' => now()]);

    DB::table('tramites')->where('id', $tramite->id)->update([
        'created_at' => now()->subDays(5),
    ]);

    expect($tramite->fresh()->dias_transcurridos)->toBe(5);
});

it('los dias de un finalizado se congelan en la fecha de finalizacion', function () {
    $tramite = Tramite::factory()->create([
        'estado' => 'finalizado',
        'fecha_finalizacion' => now()->subDays(3),
    ]);

    DB::table('tramites')->where('id', $tramite->id)->update([
        'created_at' => now()->subDays(10),
    ]);

    expect($tramite->fresh()->dias_transcurridos)->toBe(7);
});
