<?php

namespace App\Services;

use App\Models\ContadorTramite;

class ContadorTramiteService
{
    public function siguienteNumero(int $puestoId, ?int $year = null): int
    {
        $year = $year ?? now()->year;

        $contador = ContadorTramite::firstOrCreate(
            ['puesto_id' => $puestoId, 'year' => $year],
            ['ultimo_numero' => 0]
        );

        $contador->increment('ultimo_numero');
        $contador->refresh();

        return $contador->ultimo_numero;
    }

    public function reiniciar(int $puestoId, ?string $glosa = null, ?int $year = null): ContadorTramite
    {
        $year = $year ?? now()->year;

        $contador = ContadorTramite::firstOrCreate(
            ['puesto_id' => $puestoId, 'year' => $year],
            ['ultimo_numero' => 0]
        );

        $contador->update([
            'ultimo_numero' => 0,
            'reset_glosa' => $glosa,
            'ultimo_reset_at' => now(),
        ]);

        return $contador;
    }

    public function obtenerContador(int $puestoId, ?int $year = null): ?ContadorTramite
    {
        $year = $year ?? now()->year;

        return ContadorTramite::where('puesto_id', $puestoId)
            ->where('year', $year)
            ->first();
    }
}
