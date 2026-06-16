<?php

namespace App\Services;

use App\Models\Derivacion;
use App\Models\Tramite;

class DerivacionService
{
    public function derivar(Tramite $tramite, int $derivadoA, ?string $glosaDerivacion = null): Derivacion
    {
        $ultimoNumero = $tramite->derivaciones()->max('numero_derivacion') ?? 0;
        $nuevoNumero = $ultimoNumero + 1;

        $derivacion = Derivacion::create([
            'tramite_id' => $tramite->id,
            'numero_derivacion' => $nuevoNumero,
            'derivado_de' => $tramite->derivado_a,
            'derivado_a' => $derivadoA,
            'fecha_derivacion' => now(),
            'glosa_derivacion' => $glosaDerivacion,
            'estado' => 'derivado',
        ]);

        $tramite->update([
            'derivado_a' => $derivadoA,
            'estado' => 'proceso',
        ]);

        return $derivacion->load(['de', 'a']);
    }

    public function recepcionar(Derivacion $derivacion, ?string $glosaRecepcion = null): Derivacion
    {
        $derivacion->update([
            'fecha_recepcion' => now(),
            'glosa_recepcion' => $glosaRecepcion,
            'estado' => 'recepcionado',
        ]);

        $derivacion->tramite->update([
            'ultima_respuesta' => $glosaRecepcion,
        ]);

        return $derivacion->load(['de', 'a']);
    }

    public function obtenerDerivacionesDelTramite(Tramite $tramite)
    {
        return $tramite->derivaciones()
            ->with(['de', 'a'])
            ->orderBy('numero_derivacion')
            ->get();
    }
}
