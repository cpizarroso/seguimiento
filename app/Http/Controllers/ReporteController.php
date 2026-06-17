<?php

namespace App\Http\Controllers;

use App\Models\User;
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
        $funcionarioId = $request->integer('funcionario_id') ?: null;

        return Inertia::render('Reporte/Index', [
            ...$this->reporteService->resumenGeneral(),
            ...$this->reporteService->tramitesPorDiaSemana($funcionarioId),
            'tramites_por_funcionario' => $this->reporteService->tramitesPorFuncionario(),
            'funcionarios' => User::orderBy('name')->get(['id', 'name']),
            'filtro_funcionario_id' => $funcionarioId,
        ]);
    }
}
