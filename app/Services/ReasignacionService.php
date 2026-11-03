<?php

namespace App\Services;

use App\Models\Reasignacion;
use App\Models\Tramite;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReasignacionService
{
    public function __construct(
        private readonly DerivacionService $derivacionService,
    ) {}

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function listar(array $filtros, User $usuario): LengthAwarePaginator
    {
        $puedeResolver = $usuario->hasPermission('reasignaciones', 'resolucion');

        return Reasignacion::query()
            ->with(['tramite.area', 'tramite.asignado', 'solicitante.persona', 'resueltoPor.persona', 'derivacion'])
            ->when(! $puedeResolver, fn ($query) => $query->where('solicitante_id', $usuario->id))
            ->when($filtros['estado'] ?? null, fn ($query, $estado) => $query->where('estado', $estado))
            ->when($filtros['search'] ?? null, function ($query, string $busqueda): void {
                $query->whereHas('tramite', function ($tramite) use ($busqueda): void {
                    $tramite->where('numero_completo', 'like', "%{$busqueda}%")
                        ->orWhere('numero_diamante', 'like', "%{$busqueda}%")
                        ->orWhere('descripcion', 'like', "%{$busqueda}%");
                });
            })
            ->orderByRaw("CASE estado WHEN 'pendiente' THEN 0 WHEN 'aprobada' THEN 1 WHEN 'rechazada' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at')
            ->paginate($filtros['per_page'] ?? 15)
            ->withQueryString();
    }

    public function solicitar(Tramite $tramite, User $solicitante, string $motivo): Reasignacion
    {
        return DB::transaction(function () use ($tramite, $solicitante, $motivo): Reasignacion {
            $bloqueado = Tramite::query()->whereKey($tramite->id)->lockForUpdate()->firstOrFail();

            $this->validarSolicitud($bloqueado, $solicitante);

            return Reasignacion::create([
                'tramite_id' => $bloqueado->id,
                'solicitante_id' => $solicitante->id,
                'motivo' => trim($motivo),
                'estado' => Reasignacion::ESTADO_PENDIENTE,
            ])->load(['tramite.area', 'solicitante']);
        });
    }

    public function aprobar(Reasignacion $reasignacion, User $resolutor, ?string $glosa = null): Reasignacion
    {
        return DB::transaction(function () use ($reasignacion, $resolutor, $glosa): Reasignacion {
            $bloqueada = Reasignacion::query()->whereKey($reasignacion->id)->lockForUpdate()->firstOrFail();
            $this->validarPendiente($bloqueada);

            $tramite = Tramite::query()->whereKey($bloqueada->tramite_id)->lockForUpdate()->firstOrFail();

            if ($tramite->estado === 'finalizado') {
                throw ValidationException::withMessages([
                    'estado' => 'El trámite ya fue finalizado y no puede reasignarse.',
                ]);
            }

            $derivacion = $this->derivacionService->derivarRecepcionado(
                $tramite,
                (int) $bloqueada->solicitante_id,
                $this->glosaAprobacion($bloqueada, $glosa),
            );

            $bloqueada->update([
                'estado' => Reasignacion::ESTADO_APROBADA,
                'glosa_respuesta' => $glosa,
                'resuelto_por_id' => $resolutor->id,
                'derivacion_id' => $derivacion->id,
                'fecha_resolucion' => now(),
            ]);

            $this->cerrarOtrasPendientes($bloqueada, $resolutor);

            return $bloqueada->fresh(['tramite.area', 'tramite.asignado', 'solicitante', 'resueltoPor', 'derivacion']);
        });
    }

    public function rechazar(Reasignacion $reasignacion, User $resolutor, ?string $glosa = null): Reasignacion
    {
        return DB::transaction(function () use ($reasignacion, $resolutor, $glosa): Reasignacion {
            $bloqueada = Reasignacion::query()->whereKey($reasignacion->id)->lockForUpdate()->firstOrFail();
            $this->validarPendiente($bloqueada);

            $bloqueada->update([
                'estado' => Reasignacion::ESTADO_RECHAZADA,
                'glosa_respuesta' => $glosa,
                'resuelto_por_id' => $resolutor->id,
                'fecha_resolucion' => now(),
            ]);

            return $bloqueada->fresh(['tramite.area', 'solicitante', 'resueltoPor']);
        });
    }

    public function cancelar(Reasignacion $reasignacion, User $solicitante): Reasignacion
    {
        return DB::transaction(function () use ($reasignacion, $solicitante): Reasignacion {
            $bloqueada = Reasignacion::query()->whereKey($reasignacion->id)->lockForUpdate()->firstOrFail();

            if ((int) $bloqueada->solicitante_id !== (int) $solicitante->id) {
                throw ValidationException::withMessages([
                    'solicitante' => 'Solo el solicitante puede cancelar su propia solicitud.',
                ]);
            }

            $this->validarPendiente($bloqueada);

            $bloqueada->update([
                'estado' => Reasignacion::ESTADO_CANCELADA,
                'fecha_resolucion' => now(),
            ]);

            return $bloqueada->fresh(['tramite.area', 'solicitante']);
        });
    }

    /**
     * Solicitud pendiente del trámite, si existe.
     *
     * @return array<string, mixed>|null
     */
    public function pendienteDeTramite(Tramite $tramite): ?array
    {
        $pendiente = Reasignacion::query()
            ->pendientes()
            ->where('tramite_id', $tramite->id)
            ->with('solicitante.persona')
            ->latest()
            ->first();

        if ($pendiente === null) {
            return null;
        }

        return [
            'id' => $pendiente->id,
            'solicitante' => $pendiente->solicitante?->nombre_completo,
            'motivo' => $pendiente->motivo,
            'created_at' => $pendiente->created_at?->format('d/m/Y H:i'),
        ];
    }

    public function contarPendientes(): int
    {
        return Reasignacion::query()->pendientes()->count();
    }

    private function validarSolicitud(Tramite $tramite, User $solicitante): void
    {
        if ($tramite->estado === 'finalizado') {
            throw ValidationException::withMessages([
                'tramite_id' => 'Un trámite finalizado no puede reasignarse.',
            ]);
        }

        if ($this->derivacionService->puedeDerivar($tramite, (int) $solicitante->id)) {
            throw ValidationException::withMessages([
                'tramite_id' => 'Ya tienes este trámite asignado; puedes derivarlo directamente.',
            ]);
        }

        $pendiente = Reasignacion::query()
            ->pendientes()
            ->where('tramite_id', $tramite->id)
            ->exists();

        if ($pendiente) {
            throw ValidationException::withMessages([
                'tramite_id' => 'Ya existe una solicitud pendiente para este trámite.',
            ]);
        }
    }

    private function validarPendiente(Reasignacion $reasignacion): void
    {
        if (! $reasignacion->estaPendiente()) {
            throw ValidationException::withMessages([
                'estado' => 'La solicitud ya fue resuelta.',
            ]);
        }
    }

    private function glosaAprobacion(Reasignacion $reasignacion, ?string $glosa): string
    {
        $glosa = trim((string) $glosa);

        if ($glosa !== '') {
            return $glosa;
        }

        return 'Reasignación aprobada: '.$reasignacion->motivo;
    }

    private function cerrarOtrasPendientes(Reasignacion $reasignacion, User $resolutor): void
    {
        Reasignacion::query()
            ->where('tramite_id', $reasignacion->tramite_id)
            ->whereKeyNot($reasignacion->id)
            ->pendientes()
            ->update([
                'estado' => Reasignacion::ESTADO_RECHAZADA,
                'glosa_respuesta' => 'El trámite fue reasignado por otra solicitud aprobada.',
                'resuelto_por_id' => $resolutor->id,
                'fecha_resolucion' => now(),
            ]);
    }
}
