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
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->whereRaw("CONCAT(LPAD(numero_tramite, 4, '0'), '/', year) LIKE ?", ["%{$v}%"])
                        ->orWhereRaw("CONCAT((SELECT sigla FROM areas WHERE id = tramites.area_id), '-', LPAD(numero_tramite, 4, '0'), '/', year) LIKE ?", ["%{$v}%"])
                        ->orWhere('numero_tramite', 'like', "%{$v}%")
                        ->orWhere('descripcion', 'like', "%{$v}%")
                        ->orWhere('numero_diamante', 'like', "%{$v}%")
                        ->orWhere('estado', 'like', "%{$v}%")
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
            ->when($filtros['estado'] ?? null, fn ($q, $v) => $q->where('estado', $v))
            ->when(isset($filtros['urgente']) && $filtros['urgente'] !== null && $filtros['urgente'] !== '', function ($q) use ($filtros) {
                $q->where('urgente', filter_var($filtros['urgente'], FILTER_VALIDATE_BOOLEAN));
            })
            ->when($filtros['fecha_desde'] ?? null, fn ($q, $v) => $q->whereDate('fecha', '>=', $v))
            ->when($filtros['fecha_hasta'] ?? null, fn ($q, $v) => $q->whereDate('fecha', '<=', $v))
            ->orderByDesc('urgente')
            ->orderByDesc('year')
            ->orderByDesc('numero_tramite')
            ->paginate(min((int) ($filtros['per_page'] ?? 15), 100));
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
            'derivaciones' => fn ($q) => $q->with(['de', 'a'])->orderBy('numero_derivacion'),
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
