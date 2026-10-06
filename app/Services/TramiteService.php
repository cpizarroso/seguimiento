<?php

namespace App\Services;

use App\Models\Tramite;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TramiteService
{
    public function __construct(
        private readonly ContadorTramiteService $contadorService,
        private readonly DerivacionService $derivacionService,
    ) {}

    public function listar(array $filtros = [], ?int $usuarioId = null): LengthAwarePaginator
    {
        return $this->queryFiltrada($filtros)
            ->paginate(min((int) ($filtros['per_page'] ?? 15), 100));
    }

    public function coleccionParaExportar(array $filtros = []): Collection
    {
        return $this->queryFiltrada($filtros)->get();
    }

    private function queryFiltrada(array $filtros = []): Builder
    {
        return Tramite::with([
            'creador',
            'asignado',
            'area',
            'derivaciones' => function ($q) {
                $q->latest()->limit(1);
            },
            'actuaciones' => function ($q) {
                $q->with(['area', 'funcionario'])->reorder('fecha_actuacion', 'desc')->limit(1);
            },
        ])
            ->select('tramites.*')
            ->leftJoin('areas', 'areas.id', '=', 'tramites.area_id')
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('tramites.numero_completo', 'like', "%{$v}%")
                        ->orWhere('tramites.numero_tramite', 'like', "%{$v}%")
                        ->orWhere('tramites.descripcion', 'like', "%{$v}%")
                        ->orWhere('tramites.numero_diamante', 'like', "%{$v}%")
                        ->orWhere('tramites.estado', 'like', "%{$v}%")
                        ->orWhereHas('creador', fn ($q) => $q->where('name', 'like', "%{$v}%"))
                        ->orWhereHas('asignado', fn ($q) => $q->where('name', 'like', "%{$v}%"))
                        ->orWhereHas('area', fn ($q) => $q->where('nombre', 'like', "%{$v}%"));

                    if (str_contains($v, '/')) {
                        $parts = explode('/', $v);
                        $query->orWhere(function ($sub) use ($parts) {
                            foreach ($parts as $part) {
                                $part = trim($part);
                                if ($part === '') {
                                    continue;
                                }
                                $sub->where(function ($q2) use ($part) {
                                    $q2->where('numero_tramite', 'like', "%{$part}%")
                                        ->orWhere('year', 'like', "%{$part}%");
                                });
                            }
                        });
                    }
                });
            })
            ->when($filtros['estado'] ?? null, fn ($q, $v) => $q->where('tramites.estado', $v))
            ->when($filtros['area_id'] ?? null, fn ($q, $v) => $q->where('tramites.area_id', $v))
            ->when(isset($filtros['urgente']) && $filtros['urgente'] !== null && $filtros['urgente'] !== '', function ($q) use ($filtros) {
                $q->where('tramites.urgente', filter_var($filtros['urgente'], FILTER_VALIDATE_BOOLEAN));
            })
            ->when($filtros['fecha_desde'] ?? null, fn ($q, $v) => $q->whereDate('tramites.fecha', '>=', $v))
            ->when($filtros['fecha_hasta'] ?? null, fn ($q, $v) => $q->whereDate('tramites.fecha', '<=', $v))
            ->when(isset($filtros['hoy']) && $filtros['hoy'] !== null && $filtros['hoy'] !== '' && filter_var($filtros['hoy'], FILTER_VALIDATE_BOOLEAN), fn ($q) => $q->whereDate('tramites.created_at', today()))
            ->orderBy('areas.sigla')
            ->orderBy('tramites.year')
            ->orderBy('tramites.numero_tramite');
    }

    public function crear(array $data, int $creadoPor): Tramite
    {
        $areaId = $data['area_id'];
        $year = now()->year;
        $numero = $this->contadorService->siguienteNumero($areaId, $year);

        $tramite = Tramite::create([
            'numero_tramite' => $numero,
            'year' => $year,
            'fecha' => now(),
            'descripcion' => $data['descripcion'],
            'numero_diamante' => $data['numero_diamante'] ?? null,
            'estado' => 'iniciado',
            'urgente' => $data['urgente'] ?? false,
            'area_id' => $areaId,
            'creado_por' => $creadoPor,
            'derivado_a' => $creadoPor,
        ]);

        return $tramite->load(['creador', 'asignado', 'area']);
    }

    public function actualizar(Tramite $tramite, array $data): Tramite
    {
        $tramite->update([
            'descripcion' => $data['descripcion'],
            'numero_diamante' => $data['numero_diamante'] ?? null,
            'area_id' => $data['area_id'],
            'urgente' => $data['urgente'] ?? false,
        ]);

        return $tramite;
    }

    public function obtenerPorId(int $id): Tramite
    {
        return Tramite::with([
            'creador',
            'asignado',
            'area',
            'finalizadoPor',
            'derivaciones' => fn ($q) => $q->with([
                'de',
                'a',
                'actuaciones' => fn ($qa) => $qa->with(['area', 'funcionario'])->orderBy('fecha_actuacion'),
            ])->orderBy('numero_derivacion'),
            'actuaciones' => fn ($q) => $q->with(['area', 'funcionario'])->orderBy('fecha_actuacion'),
        ])->findOrFail($id);
    }

    public function cambiarEstado(Tramite $tramite, string $estado, ?array $data = []): Tramite
    {
        if (! in_array($estado, Tramite::ESTADOS)) {
            throw new \InvalidArgumentException("Estado inválido: {$estado}");
        }

        $updateData = ['estado' => $estado];

        if ($estado === 'finalizado') {
            $updateData['glosa_finalizacion'] = $data['glosa_finalizacion'] ?? null;
            $updateData['fecha_finalizacion'] = now();
            $updateData['finalizado_por'] = auth()->id();
        }

        $tramite->update($updateData);

        return $tramite;
    }

    public function eliminar(Tramite $tramite): void
    {
        $tramite->delete();
    }
}
