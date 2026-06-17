<?php

namespace App\Services;

use App\Models\Tramite;
use App\Models\User;

class ReporteService
{
    public function resumenGeneral(): array
    {
        return [
            'total_tramites' => Tramite::count(),
            'por_estado' => Tramite::selectRaw('estado, count(*) as total')
                ->groupBy('estado')
                ->pluck('total', 'estado'),
            'tramites_por_mes' => Tramite::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as mes, count(*) as total")
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

    public function tramitesPorFuncionario(): array
    {
        return User::query()
            ->selectRaw('users.id, users.name, COUNT(CASE WHEN tramites.estado != \'finalizado\' THEN 1 END) as total')
            ->leftJoin('tramites', 'tramites.creado_por', '=', 'users.id')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get()
            ->toArray();
    }
}
