<?php

namespace App\Services;

use App\Models\Tramite;
use Illuminate\Pagination\LengthAwarePaginator;

class TramiteService
{
    public function __construct(
        private readonly ContadorTramiteService $contadorService,
        private readonly DerivacionService $derivacionService,
    ) {}

    public function listar(array $filtros = [], ?int $usuarioId = null): LengthAwarePaginator
    {
        $vista = $filtros['vista'] ?? 'bandeja';

        return Tramite::with(['creador', 'asignado', 'puesto', 'derivaciones' => function ($q) {
            $q->latest()->limit(1);
        }])
            ->when($usuarioId, fn($q) => $q->where('derivado_a', $usuarioId))
            ->when($vista === 'por_recepcionar', function ($q) {
                $q->whereHas('derivaciones', fn($q) => $q->where('estado', 'derivado'));
            })
            ->when($vista === 'recepcionados', function ($q) {
                $q->whereHas('derivaciones', fn($q) => $q->where('estado', 'recepcionado'));
            })
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('numero_tramite', 'like', "%{$v}%")
                        ->orWhere('descripcion', 'like', "%{$v}%")
                        ->orWhere('glosa', 'like', "%{$v}%")
                        ->orWhere('numero_diamante', 'like', "%{$v}%")
                        ->orWhere('estado', 'like', "%{$v}%")
                        ->orWhere('year', 'like', "%{$v}%")
                        ->orWhereHas('creador', fn($q) => $q->where('name', 'like', "%{$v}%"))
                        ->orWhereHas('asignado', fn($q) => $q->where('name', 'like', "%{$v}%"));
                });
            })
            ->when($filtros['estado'] ?? null, fn($q, $v) => $q->where('estado', $v))
            ->when($filtros['puesto_id'] ?? null, fn($q, $v) => $q->where('puesto_id', $v))
            ->when($filtros['fecha_desde'] ?? null, fn($q, $v) => $q->whereDate('fecha', '>=', $v))
            ->when($filtros['fecha_hasta'] ?? null, fn($q, $v) => $q->whereDate('fecha', '<=', $v))
            ->orderByDesc('year')
            ->orderByDesc('numero_tramite')
            ->paginate(15);
    }

    public function crear(array $data, int $creadoPor): Tramite
    {
        $puestoId = $data['puesto_id'];
        $year = now()->year;
        $numero = $this->contadorService->siguienteNumero($puestoId, $year);

        $tramite = Tramite::create([
            'numero_tramite' => $numero,
            'year' => $year,
            'fecha' => $data['fecha'],
            'descripcion' => $data['descripcion'],
            'numero_diamante' => $data['numero_diamante'] ?? null,
            'glosa' => $data['glosa'] ?? null,
            'estado' => 'iniciado',
            'puesto_id' => $puestoId,
            'creado_por' => $creadoPor,
            'derivado_a' => $creadoPor,
        ]);

        return $tramite->load(['creador', 'asignado', 'puesto']);
    }

    public function obtenerPorId(int $id): Tramite
    {
        return Tramite::with([
            'creador',
            'asignado',
            'puesto',
            'derivaciones' => fn($q) => $q->with(['de', 'a'])->orderBy('numero_derivacion'),
        ])->findOrFail($id);
    }

    public function cambiarEstado(Tramite $tramite, string $estado): Tramite
    {
        if (!in_array($estado, Tramite::ESTADOS)) {
            throw new \InvalidArgumentException("Estado inválido: {$estado}");
        }

        $tramite->update(['estado' => $estado]);

        return $tramite;
    }

    public function eliminar(Tramite $tramite): void
    {
        $tramite->delete();
    }
}
