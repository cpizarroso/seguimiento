<?php

namespace App\Http\Controllers\Reasignaciones;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reasignaciones\ResolverReasignacionRequest;
use App\Http\Requests\Reasignaciones\StoreReasignacionRequest;
use App\Http\Resources\ReasignacionResource;
use App\Models\Reasignacion;
use App\Models\Tramite;
use App\Services\ReasignacionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReasignacionController extends Controller
{
    public function __construct(
        private readonly ReasignacionService $reasignacionService,
    ) {}

    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(Reasignacion::ESTADOS)],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $usuario = $request->user();

        return Inertia::render('Reasignaciones/Index', [
            'reasignaciones' => ReasignacionResource::collection(
                $this->reasignacionService->listar($filtros, $usuario)
            ),
            'puede_resolver' => $usuario->hasPermission('reasignaciones', 'resolucion'),
            'filtros' => [
                'estado' => $filtros['estado'] ?? '',
                'search' => $filtros['search'] ?? '',
            ],
        ]);
    }

    public function store(StoreReasignacionRequest $request): RedirectResponse
    {
        $tramite = Tramite::findOrFail($request->integer('tramite_id'));

        $this->reasignacionService->solicitar(
            $tramite,
            $request->user(),
            (string) $request->input('motivo'),
        );

        return back()->with('success', "Solicitud de reasignación registrada para el trámite {$tramite->numero_completo}.");
    }

    public function aprobar(ResolverReasignacionRequest $request, Reasignacion $reasignacion): RedirectResponse
    {
        $this->reasignacionService->aprobar(
            $reasignacion,
            $request->user(),
            $request->input('glosa_respuesta'),
        );

        return back()->with('success', 'Solicitud aprobada: el trámite quedó asignado al solicitante.');
    }

    public function rechazar(ResolverReasignacionRequest $request, Reasignacion $reasignacion): RedirectResponse
    {
        $this->reasignacionService->rechazar(
            $reasignacion,
            $request->user(),
            $request->input('glosa_respuesta'),
        );

        return back()->with('success', 'Solicitud rechazada.');
    }

    public function cancelar(Request $request, Reasignacion $reasignacion): RedirectResponse
    {
        $this->reasignacionService->cancelar($reasignacion, $request->user());

        return back()->with('success', 'Solicitud cancelada.');
    }
}
