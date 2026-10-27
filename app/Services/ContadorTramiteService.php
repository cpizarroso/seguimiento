<?php

namespace App\Services;

use App\Models\Area;
use App\Models\ContadorTramite;
use App\Models\Tramite;
use Illuminate\Support\Collection;

class ContadorTramiteService
{
    public function siguienteNumero(int $areaId, ?int $year = null): int
    {
        $year = $year ?? now()->year;

        $contador = ContadorTramite::firstOrCreate(
            ['area_id' => $areaId, 'year' => $year],
            ['ultimo_numero' => 0]
        );

        $contador->increment('ultimo_numero');
        $contador->refresh();

        return $contador->ultimo_numero;
    }

    public function reiniciar(int $areaId, ?string $glosa = null, ?int $year = null): ContadorTramite
    {
        $year = $year ?? now()->year;

        $contador = ContadorTramite::firstOrCreate(
            ['area_id' => $areaId, 'year' => $year],
            ['ultimo_numero' => 0]
        );

        $contador->update([
            'ultimo_numero' => 0,
            'reset_glosa' => $glosa,
            'ultimo_reset_at' => now(),
        ]);

        return $contador;
    }

    public function obtenerContador(int $areaId, ?int $year = null): ?ContadorTramite
    {
        $year = $year ?? now()->year;

        return ContadorTramite::where('area_id', $areaId)
            ->where('year', $year)
            ->first();
    }

    /**
     * Secuencias vigentes por área, sin crear contadores ni consumir números.
     *
     * @param  Collection<int, Area>  $areas
     * @return array<int, array{ultimo_numero: int, ultimo_completo: ?string, siguiente: int, numero_completo: string}>
     */
    public function secuenciasParaAreas(Collection $areas, ?int $year = null): array
    {
        $year = $year ?? now()->year;

        $ultimos = ContadorTramite::where('year', $year)
            ->whereIn('area_id', $areas->pluck('id'))
            ->pluck('ultimo_numero', 'area_id');

        return $areas->mapWithKeys(function ($area) use ($ultimos, $year) {
            $ultimo = (int) ($ultimos[$area->id] ?? 0);
            $siguiente = $ultimo + 1;

            return [$area->id => [
                'ultimo_numero' => $ultimo,
                'ultimo_completo' => $ultimo > 0
                    ? Tramite::generarNumeroCompleto($area->id, $ultimo, $year, $area->codigo)
                    : null,
                'siguiente' => $siguiente,
                'numero_completo' => Tramite::generarNumeroCompleto($area->id, $siguiente, $year, $area->codigo),
            ]];
        })->all();
    }
}
