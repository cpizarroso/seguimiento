<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->regenerar(fn (string $codigo, int $numero, int $year): string => sprintf('%s-%04d/%d', $codigo, $numero, $year));
    }

    public function down(): void
    {
        $this->regenerar(fn (string $codigo, int $numero, int $year): string => sprintf('%s-%d/%d', $codigo, $numero, $year));
    }

    private function regenerar(Closure $formato): void
    {
        DB::transaction(function () use ($formato): void {
            // Se limpia primero para evitar choques contra el índice único
            // mientras se reescriben los valores existentes.
            DB::table('tramites')->update(['numero_completo' => null]);

            DB::table('tramites')
                ->select(['id', 'area_id', 'numero_tramite', 'year'])
                ->orderBy('id')
                ->chunkById(500, function ($tramites) use ($formato): void {
                    $codigos = DB::table('areas')
                        ->whereIn('id', $tramites->pluck('area_id')->unique()->all())
                        ->pluck('codigo', 'id');

                    foreach ($tramites as $tramite) {
                        $codigo = $codigos[$tramite->area_id] ?? null;

                        if ($codigo === null) {
                            continue;
                        }

                        DB::table('tramites')
                            ->where('id', $tramite->id)
                            ->update([
                                'numero_completo' => $formato(
                                    $codigo,
                                    (int) $tramite->numero_tramite,
                                    (int) $tramite->year,
                                ),
                            ]);
                    }
                });
        });
    }
};
