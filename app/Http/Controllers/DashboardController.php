<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ReporteService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ReporteService $reporteService
    ) {}

    public function index(Request $request)
    {
        $usuarioId = $request->integer('usuario_id') ?: ($request->integer('funcionario_id') ?: null);

        return Inertia::render('Dashboard', [
            ...$this->reporteService->resumenGeneral(),
            ...$this->reporteService->tramitesPorDiaSemana($usuarioId),
            'tramites_por_usuario' => $this->reporteService->tramitesPorUsuario(),
            'tramites_por_area' => $this->reporteService->tramitesPorArea($usuarioId),
            'tramites_urgentes' => $this->reporteService->tramitesUrgentes($usuarioId),
            'usuarios' => User::orderBy('name')->get(['id', 'name']),
            'filtro_usuario_id' => $usuarioId,
        ]);
    }
}
