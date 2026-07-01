<?php

namespace App\Http\Controllers;

use App\Services\ReporteService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReporteController extends Controller
{
    public function __construct(
        private readonly ReporteService $reporteService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user()->load('roles.permisos.modulo', 'roles.permisos.accion');
        $userId = $request->integer('user_id') ?: $user->id;

        return Inertia::render('Reporte/Index', [
            ...$this->reporteService->resumenGeneral($userId),
            ...$this->reporteService->tramitesPorDiaSemana($userId),
            'tramites_por_area' => $this->reporteService->tramitesPorArea($userId),
            'tramites_urgentes' => $this->reporteService->tramitesUrgentes($userId),
            'auth_user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'permisos' => $user->permisos_slug,
            ],
            'filtro_user_id' => $userId,
        ]);
    }
}
