<?php

namespace App\Services;

use App\Models\Tramite;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ReporteService
{
    public const PER_PAGE_DOCUMENTO = 15;

    /**
     * Trámites del área del usuario en un rango de fechas.
     * El filtro usa created_at (fecha de ingreso al sistema).
     * Sin área, el reporte queda vacío.
     *
     * @param  array{fecha_desde?: ?string, fecha_hasta?: ?string}  $filtros
     */
    public function ingresadosQuery(?int $areaId, array $filtros = []): Builder
    {
        $query = Tramite::with('creador:id,name');

        if ($areaId === null) {
            return $query->whereRaw('0 = 1');
        }

        return $query
            ->where('area_id', $areaId)
            ->when($filtros['fecha_desde'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filtros['fecha_hasta'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderBy('numero_tramite')
            ->orderBy('id');
    }

    /**
     * @param  array{fecha_desde?: ?string, fecha_hasta?: ?string, per_page?: ?int}  $filtros
     */
    public function ingresadosPaginados(?int $areaId, array $filtros = []): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filtros['per_page'] ?? self::PER_PAGE_DOCUMENTO), 1), 100);

        return $this->ingresadosQuery($areaId, $filtros)->paginate($perPage);
    }

    /**
     * @param  array{fecha_desde?: ?string, fecha_hasta?: ?string}  $filtros
     */
    public function ingresadosColeccion(?int $areaId, array $filtros = []): Collection
    {
        return $this->ingresadosQuery($areaId, $filtros)->get();
    }
    public function resumenGeneral(?int $userId = null): array
    {
        $query = Tramite::query();
        if ($userId) {
            $query->where('creado_por', $userId);
        }

        return [
            'total_tramites' => (clone $query)->count(),
            'por_estado' => (clone $query)
                ->selectRaw('estado, count(*) as total')
                ->groupBy('estado')
                ->pluck('total', 'estado'),
            'tramites_por_mes' => (clone $query)
                ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mes, count(*) as total")
                ->groupBy('mes')
                ->orderBy('mes')
                ->pluck('total', 'mes'),
        ];
    }

    public function tramitesPorDiaSemana(?int $funcionarioId = null): array
    {
        $queryIniciados = Tramite::selectRaw('DAYOFWEEK(fecha) as dia, COUNT(*) as total')
            ->whereNotNull('fecha')
            ->groupBy('dia')
            ->orderBy('dia');

        $queryFinalizados = Tramite::selectRaw('DAYOFWEEK(fecha) as dia, COUNT(*) as total')
            ->where('estado', 'finalizado')
            ->whereNotNull('fecha')
            ->groupBy('dia')
            ->orderBy('dia');

        if ($funcionarioId) {
            $queryIniciados->where('creado_por', $funcionarioId);
            $queryFinalizados->where('creado_por', $funcionarioId);
        }

        $iniciados = $queryIniciados->pluck('total', 'dia');
        $finalizados = $queryFinalizados->pluck('total', 'dia');

        $iniciadosPorDia = [];
        $finalizadosPorDia = [];
        foreach (range(1, 7) as $dia) {
            $iniciadosPorDia[$dia] = (int) ($iniciados[$dia] ?? 0);
            $finalizadosPorDia[$dia] = (int) ($finalizados[$dia] ?? 0);
        }

        return [
            'iniciados_por_dia' => $iniciadosPorDia,
            'finalizados_por_dia' => $finalizadosPorDia,
        ];
    }

    public function tramitesPorFuncionario(?int $userId = null): array
    {
        $query = User::query()
            ->selectRaw('users.id, users.name, COUNT(CASE WHEN tramites.estado != \'finalizado\' THEN 1 END) as total')
            ->leftJoin('tramites', 'tramites.creado_por', '=', 'users.id')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total');

        if ($userId) {
            $query->where('users.id', $userId);
        }

        return $query->get()->toArray();
    }

    public function tramitesUrgentes(?int $userId = null): array
    {
        $tramites = Tramite::with('area:id,sigla,nombre')
            ->where('estado', '!=', 'finalizado')
            ->when($userId, fn ($q) => $q->where('creado_por', $userId))
            ->get()
            ->map(fn ($t) => $t->setAttribute('dias', (int) ($t->created_at ?? $t->fecha ?? now())->diffInDays(now())));

        $filtrar = fn ($minDias) => $tramites->filter(fn ($t) => $t->dias >= $minDias);

        return [
            'tres_dias' => $filtrar(3)->count(),
            'cuatro_dias' => $filtrar(4)->count(),
            'cinco_dias' => $filtrar(5)->count(),
            'lista' => $filtrar(3)
                ->sortByDesc('dias')
                ->take(10)
                ->values()
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'numero_completo' => $t->numero_completo,
                    'descripcion' => Str::limit($t->descripcion, 80),
                    'dias' => $t->dias,
                    'area_sigla' => $t->area?->sigla,
                    'estado' => $t->estado,
                ]),
        ];
    }

    public function tramitesPorArea(?int $funcionarioId = null): array
    {
        return Tramite::selectRaw('areas.nombre as name, COUNT(*) as total')
            ->join('areas', 'tramites.area_id', '=', 'areas.id')
            ->groupBy('areas.id', 'areas.nombre')
            ->orderByDesc('total')
            ->when($funcionarioId, fn ($q) => $q->where('tramites.creado_por', $funcionarioId))
            ->get()
            ->toArray();
    }
}
