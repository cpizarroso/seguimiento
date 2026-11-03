<?php

namespace App\Services;

use App\Models\Modificacion;
use App\Models\Tramite;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ModificacionService
{
    /**
     * @param  array<string, mixed>  $filtros
     */
    public function listar(array $filtros, User $usuario): LengthAwarePaginator
    {
        $puedeResolver = $usuario->hasPermission('modificaciones', 'resolucion');

        return Modificacion::query()
            ->with(['tramite.area', 'tramite.asignado', 'solicitante.persona', 'resueltoPor.persona'])
            ->when(! $puedeResolver, fn ($query) => $query->where('solicitante_id', $usuario->id))
            ->when($filtros['estado'] ?? null, fn ($query, $estado) => $query->where('estado', $estado))
            ->when($filtros['tipo'] ?? null, fn ($query, $tipo) => $query->where('tipo', $tipo))
            ->when($filtros['search'] ?? null, function ($query, string $busqueda): void {
                $query->whereHas('tramite', function ($tramite) use ($busqueda): void {
                    $tramite->where('numero_completo', 'like', "%{$busqueda}%")
                        ->orWhere('numero_diamante', 'like', "%{$busqueda}%")
                        ->orWhere('descripcion', 'like', "%{$busqueda}%");
                });
            })
            ->orderByRaw("CASE estado WHEN 'pendiente' THEN 0 WHEN 'aprobada' THEN 1 WHEN 'consumida' THEN 2 WHEN 'rechazada' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->paginate($filtros['per_page'] ?? 15)
            ->withQueryString();
    }

    /**
     * Solicitudes de un trámite para mostrarlas en su detalle.
     *
     * @return Collection<int, Modificacion>
     */
    public function delTramite(Tramite $tramite): Collection
    {
        return Modificacion::query()
            ->where('tramite_id', $tramite->id)
            ->with(['solicitante', 'resueltoPor'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();
    }

    public function solicitar(
        Tramite $tramite,
        User $solicitante,
        string $tipo,
        string $motivo,
        ?string $propuesta = null,
    ): Modificacion {
        return DB::transaction(function () use ($tramite, $solicitante, $tipo, $motivo, $propuesta): Modificacion {
            $bloqueado = Tramite::query()->whereKey($tramite->id)->lockForUpdate()->firstOrFail();

            $this->validarSolicitud($bloqueado, $solicitante, $tipo);

            return Modificacion::create([
                'tramite_id' => $bloqueado->id,
                'solicitante_id' => $solicitante->id,
                'tipo' => $tipo,
                'motivo' => trim($motivo),
                'propuesta' => filled($propuesta) ? trim((string) $propuesta) : null,
                'estado' => Modificacion::ESTADO_PENDIENTE,
            ])->load(['tramite.area', 'solicitante']);
        });
    }

    public function aprobar(Modificacion $modificacion, User $resolutor, ?string $glosa = null): Modificacion
    {
        return DB::transaction(function () use ($modificacion, $resolutor, $glosa): Modificacion {
            $bloqueada = Modificacion::query()->whereKey($modificacion->id)->lockForUpdate()->firstOrFail();
            $this->validarPendiente($bloqueada);

            $tramite = Tramite::query()->whereKey($bloqueada->tramite_id)->lockForUpdate()->firstOrFail();

            if ($tramite->estaAnulado()) {
                throw ValidationException::withMessages([
                    'estado' => 'El trámite fue dado de baja y ya no admite modificaciones.',
                ]);
            }

            $bloqueada->update([
                'estado' => Modificacion::ESTADO_APROBADA,
                'glosa_respuesta' => $glosa,
                'resuelto_por_id' => $resolutor->id,
                'fecha_resolucion' => now(),
            ]);

            $this->cerrarOtrasPendientes($bloqueada, $resolutor);

            return $bloqueada->fresh(['tramite.area', 'tramite.asignado', 'solicitante', 'resueltoPor']);
        });
    }

    public function rechazar(Modificacion $modificacion, User $resolutor, ?string $glosa = null): Modificacion
    {
        return DB::transaction(function () use ($modificacion, $resolutor, $glosa): Modificacion {
            $bloqueada = Modificacion::query()->whereKey($modificacion->id)->lockForUpdate()->firstOrFail();
            $this->validarPendiente($bloqueada);

            $bloqueada->update([
                'estado' => Modificacion::ESTADO_RECHAZADA,
                'glosa_respuesta' => $glosa,
                'resuelto_por_id' => $resolutor->id,
                'fecha_resolucion' => now(),
            ]);

            return $bloqueada->fresh(['tramite.area', 'solicitante', 'resueltoPor']);
        });
    }

    public function cancelar(Modificacion $modificacion, User $solicitante): Modificacion
    {
        return DB::transaction(function () use ($modificacion, $solicitante): Modificacion {
            $bloqueada = Modificacion::query()->whereKey($modificacion->id)->lockForUpdate()->firstOrFail();

            if ((int) $bloqueada->solicitante_id !== (int) $solicitante->id) {
                throw ValidationException::withMessages([
                    'solicitante' => 'Solo el solicitante puede cancelar su propia solicitud.',
                ]);
            }

            $this->validarPendiente($bloqueada);

            $bloqueada->update([
                'estado' => Modificacion::ESTADO_CANCELADA,
                'fecha_resolucion' => now(),
            ]);

            return $bloqueada->fresh(['tramite.area', 'solicitante']);
        });
    }

    /**
     * Autorización aprobada y sin consumir del usuario para el trámite y tipo.
     */
    public function autorizacionDe(Tramite $tramite, User $usuario, string $tipo): ?Modificacion
    {
        return Modificacion::query()
            ->where('tramite_id', $tramite->id)
            ->where('solicitante_id', $usuario->id)
            ->where('tipo', $tipo)
            ->aprobadas()
            ->latest()
            ->first();
    }

    public function puedeEditar(Tramite $tramite, User $usuario): bool
    {
        if ($tramite->estaAnulado()) {
            return false;
        }

        if ($usuario->hasPermission('tramites', 'edicion')) {
            return true;
        }

        return $this->autorizacionDe($tramite, $usuario, Modificacion::TIPO_DESCRIPCION) !== null;
    }

    public function puedeDarBaja(Tramite $tramite, User $usuario): bool
    {
        if ($tramite->estaAnulado()) {
            return false;
        }

        if ($usuario->hasPermission('tramites', 'baja')) {
            return true;
        }

        return $this->autorizacionDe($tramite, $usuario, Modificacion::TIPO_BAJA) !== null;
    }

    /**
     * Marca la autorización como usada. Devuelve false si ya había sido
     * consumida (evita el doble uso incluso sin transacciones reales).
     */
    public function consumir(?Modificacion $autorizacion): bool
    {
        if ($autorizacion === null) {
            return true;
        }

        $afectadas = Modificacion::query()
            ->whereKey($autorizacion->id)
            ->where('estado', Modificacion::ESTADO_APROBADA)
            ->update([
                'estado' => Modificacion::ESTADO_CONSUMIDA,
                'fecha_uso' => now(),
            ]);

        return $afectadas === 1;
    }

    /**
     * Solicitud pendiente del trámite, si existe, para avisarlo en el detalle.
     *
     * @return array<string, mixed>|null
     */
    public function pendienteDeTramite(Tramite $tramite): ?array
    {
        $pendiente = Modificacion::query()
            ->pendientes()
            ->where('tramite_id', $tramite->id)
            ->with('solicitante')
            ->latest()
            ->first();

        if ($pendiente === null) {
            return null;
        }

        return [
            'id' => $pendiente->id,
            'tipo' => $pendiente->tipo,
            'solicitante' => $pendiente->solicitante?->nombre_completo,
            'motivo' => $pendiente->motivo,
            'created_at' => $pendiente->created_at?->format('d/m/Y H:i'),
        ];
    }

    public function contarPendientes(): int
    {
        return Modificacion::query()->pendientes()->count();
    }

    private function validarSolicitud(Tramite $tramite, User $solicitante, string $tipo): void
    {
        if ($tramite->estaAnulado()) {
            throw ValidationException::withMessages([
                'tramite_id' => 'El trámite está dado de baja y no admite modificaciones.',
            ]);
        }

        if ($tramite->estado === 'finalizado') {
            throw ValidationException::withMessages([
                'tramite_id' => 'Un trámite finalizado no puede modificarse.',
            ]);
        }

        $permisoDirecto = $tipo === Modificacion::TIPO_BAJA ? 'baja' : 'edicion';

        if ($solicitante->hasPermission('tramites', $permisoDirecto)) {
            throw ValidationException::withMessages([
                'tramite_id' => 'Tienes permiso para hacerlo directamente, no necesitas solicitar autorización.',
            ]);
        }

        if ($this->autorizacionDe($tramite, $solicitante, $tipo) !== null) {
            throw ValidationException::withMessages([
                'tramite_id' => 'Ya tienes una autorización aprobada pendiente de uso para este trámite.',
            ]);
        }

        $pendiente = Modificacion::query()
            ->pendientes()
            ->where('tramite_id', $tramite->id)
            ->where('tipo', $tipo)
            ->exists();

        if ($pendiente) {
            throw ValidationException::withMessages([
                'tramite_id' => 'Ya existe una solicitud pendiente de ese tipo para este trámite.',
            ]);
        }
    }

    private function validarPendiente(Modificacion $modificacion): void
    {
        if (! $modificacion->estaPendiente()) {
            throw ValidationException::withMessages([
                'estado' => 'La solicitud ya fue resuelta.',
            ]);
        }
    }

    private function cerrarOtrasPendientes(Modificacion $modificacion, User $resolutor): void
    {
        Modificacion::query()
            ->where('tramite_id', $modificacion->tramite_id)
            ->where('tipo', $modificacion->tipo)
            ->whereKeyNot($modificacion->id)
            ->pendientes()
            ->update([
                'estado' => Modificacion::ESTADO_RECHAZADA,
                'glosa_respuesta' => 'El trámite ya fue autorizado por otra solicitud aprobada.',
                'resuelto_por_id' => $resolutor->id,
                'fecha_resolucion' => now(),
            ]);
    }
}
