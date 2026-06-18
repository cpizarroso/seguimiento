<?php

namespace App\Services;

use App\Models\Derivacion;
use App\Models\Tramite;

class DerivacionService
{
    public function derivar(Tramite $tramite, int $derivadoA, ?string $glosaDerivacion = null): Derivacion
    {
        $this->marcarAnterioresComoHistorico($tramite);

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

    public function observar(Tramite $tramite, int $derivadoA, ?string $glosaObservacion = null): Derivacion
    {
        $this->marcarAnterioresComoHistorico($tramite);

        $ultimoNumero = $tramite->derivaciones()->max('numero_derivacion') ?? 0;
        $nuevoNumero = $ultimoNumero + 1;

        $derivacion = Derivacion::create([
            'tramite_id' => $tramite->id,
            'numero_derivacion' => $nuevoNumero,
            'derivado_de' => $tramite->derivado_a,
            'derivado_a' => $derivadoA,
            'fecha_derivacion' => now(),
            'glosa_derivacion' => $glosaObservacion,
            'estado' => 'derivado',
        ]);

        $tramite->update([
            'derivado_a' => $derivadoA,
            'estado' => 'observado',
        ]);

        return $derivacion->load(['de', 'a']);
    }

    public function recepcionar(Derivacion $derivacion, ?string $glosaRecepcion = null): Derivacion
    {
        if (!in_array($derivacion->estado, [Derivacion::ESTADOS[0]])) {
            throw new \InvalidArgumentException("Solo se pueden recepcionar derivaciones en estado 'derivado'.");
        }

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

    public function rechazar(Derivacion $derivacion, ?string $glosaRechazo = null): Derivacion
    {
        if (!in_array($derivacion->estado, ['derivado', 'recepcionado'])) {
            throw new \InvalidArgumentException("Solo se pueden rechazar derivaciones en estado 'derivado' o 'recepcionado'.");
        }

        $funcionarioAnterior = $derivacion->derivado_de;

        $derivacion->update([
            'fecha_recepcion' => now(),
            'glosa_recepcion' => $glosaRechazo,
            'estado' => 'rechazado',
        ]);

        $derivacion->tramite->update([
            'derivado_a' => $funcionarioAnterior,
            'estado' => 'proceso',
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

    private function marcarAnterioresComoHistorico(Tramite $tramite): void
    {
        $tramite->derivaciones()
            ->whereIn('estado', ['derivado', 'recepcionado'])
            ->update(['estado' => 'historico']);
    }
}
