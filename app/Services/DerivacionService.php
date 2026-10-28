<?php

namespace App\Services;

use App\Models\Derivacion;
use App\Models\Tramite;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
        if (! in_array($derivacion->estado, [Derivacion::ESTADOS[0]])) {
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
        if (! in_array($derivacion->estado, ['derivado', 'recepcionado'])) {
            throw new \InvalidArgumentException("Solo se pueden rechazar derivaciones en estado 'derivado' o 'recepcionado'.");
        }

        $usuarioAnterior = $derivacion->derivado_de;

        $derivacion->update([
            'fecha_recepcion' => now(),
            'glosa_recepcion' => $glosaRechazo,
            'estado' => 'rechazado',
        ]);

        $derivacion->tramite->update([
            'derivado_a' => $usuarioAnterior,
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

    /**
     * Un trámite solo puede derivarse si está asignado al usuario,
     * no está finalizado y la última derivación fue recepcionada por él.
     */
    public function puedeDerivar(Tramite $tramite, int $usuarioId): bool
    {
        if ($tramite->estado === 'finalizado' || (int) $tramite->derivado_a !== $usuarioId) {
            return false;
        }

        $ultima = $tramite->derivaciones()
            ->reorder('numero_derivacion', 'desc')
            ->first();

        return $ultima !== null
            && $ultima->estado === 'recepcionado'
            && (int) $ultima->derivado_a === $usuarioId;
    }

    /**
     * Deriva varios trámites al mismo destino dentro de una transacción.
     *
     * @param  Collection<int, Tramite>  $tramites
     */
    public function derivarVarios(Collection $tramites, int $derivadoA, ?string $glosaDerivacion = null): int
    {
        return DB::transaction(function () use ($tramites, $derivadoA, $glosaDerivacion) {
            foreach ($tramites as $tramite) {
                $this->derivar($tramite, $derivadoA, $glosaDerivacion);
            }

            return $tramites->count();
        });
    }

    /**
     * Usuarios que pueden recibir una derivación: tienen persona,
     * un puesto vigente y pertenecen a un área activa.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function destinatariosParaDerivar(int $excluirUserId): Collection
    {
        return User::query()
            ->with(['persona.puestoActivo.puesto.area'])
            ->where('users.id', '!=', $excluirUserId)
            ->whereNotNull('persona_id')
            ->get()
            ->map(function (User $usuario): ?array {
                $persona = $usuario->persona;
                $puesto = $persona?->puestoActivo?->puesto;
                $area = $puesto?->area;

                if (! $persona || ! $puesto || ! $area || ! $puesto->activo || ! $area->activo) {
                    return null;
                }

                return [
                    'user_id' => $usuario->id,
                    'name' => $usuario->nombre_completo,
                    'persona' => trim($persona->nombres.' '.$persona->apellidos),
                    'area_id' => $area->id,
                    'area_codigo' => $area->codigo,
                    'area_nombre' => $area->nombre,
                ];
            })
            ->filter()
            ->sortBy(fn (array $destinatario) => mb_strtolower($destinatario['area_nombre'].'|'.$destinatario['persona']))
            ->values();
    }

    private function marcarAnterioresComoHistorico(Tramite $tramite): void
    {
        $tramite->derivaciones()
            ->whereIn('estado', ['derivado', 'recepcionado'])
            ->update(['estado' => 'historico']);
    }
}
