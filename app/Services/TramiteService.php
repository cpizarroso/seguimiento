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

        return Tramite::with(['creador', 'asignado', 'area', 'derivaciones' => function ($q) {
            $q->latest()->limit(1);
        }])
            ->when($usuarioId, function ($q) use ($usuarioId, $vista) {
                if ($vista === 'bandeja') {
                    $q->where('derivado_a', $usuarioId)
                        ->whereDoesntHave('derivaciones', fn($q) => $q
                            ->where('derivado_a', $usuarioId)
                            ->where('estado', 'derivado')
                        );
                } elseif ($vista === 'por_recepcionar') {
                    $q->whereHas('derivaciones', fn($q) => $q
                        ->where('derivado_a', $usuarioId)
                        ->where('estado', 'derivado')
                    );
                } elseif ($vista === 'derivados') {
                    $q->whereHas('derivaciones', fn($q) => $q
                        ->where('derivado_de', $usuarioId)
                        ->where('estado', 'derivado')
                    );
                }
            })
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->whereRaw("CONCAT(LPAD(numero_tramite, 4, '0'), '/', year) LIKE ?", ["%{$v}%"])
                        ->orWhere('numero_tramite', 'like', "%{$v}%")
                        ->orWhere('descripcion', 'like', "%{$v}%")
                        ->orWhere('numero_diamante', 'like', "%{$v}%")
                        ->orWhere('estado', 'like', "%{$v}%")
                        ->orWhereHas('creador', fn($q) => $q->where('name', 'like', "%{$v}%"))
                        ->orWhereHas('asignado', fn($q) => $q->where('name', 'like', "%{$v}%"))
                        ->orWhereHas('area', fn($q) => $q->where('nombre', 'like', "%{$v}%"));

                    if (str_contains($v, '/')) {
                        $parts = explode('/', $v);
                        $query->orWhere(function ($sub) use ($parts) {
                            foreach ($parts as $part) {
                                $part = trim($part);
                                if ($part === '') continue;
                                $sub->where(function ($q2) use ($part) {
                                    $q2->where('numero_tramite', 'like', "%{$part}%")
                                        ->orWhere('year', 'like', "%{$part}%");
                                });
                            }
                        });
                    }
                });
            })
            ->when($filtros['estado'] ?? null, fn($q, $v) => $q->where('estado', $v))
            ->when($filtros['fecha_desde'] ?? null, fn($q, $v) => $q->whereDate('fecha', '>=', $v))
            ->when($filtros['fecha_hasta'] ?? null, fn($q, $v) => $q->whereDate('fecha', '<=', $v))
            ->orderByDesc('year')
            ->orderByDesc('numero_tramite')
            ->paginate(15);
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
            'area_id' => $areaId,
            'creado_por' => $creadoPor,
            'derivado_a' => $creadoPor,
        ]);

        return $tramite->load(['creador', 'asignado', 'area']);
    }

    public function obtenerPorId(int $id): Tramite
    {
        return Tramite::with([
            'creador',
            'asignado',
            'area',
            'finalizadoPor',
            'derivaciones' => fn($q) => $q->with(['de', 'a'])->orderBy('numero_derivacion'),
        ])->findOrFail($id);
    }

    public function cambiarEstado(Tramite $tramite, string $estado, ?array $data = []): Tramite
    {
        if (!in_array($estado, Tramite::ESTADOS)) {
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
