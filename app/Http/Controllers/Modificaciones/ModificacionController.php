<?php

namespace App\Http\Controllers\Modificaciones;

use App\Http\Controllers\Controller;
use App\Http\Requests\Modificaciones\RechazarModificacionRequest;
use App\Http\Requests\Modificaciones\ResolverModificacionRequest;
use App\Http\Requests\Modificaciones\StoreModificacionRequest;
use App\Http\Resources\ModificacionResource;
use App\Models\Modificacion;
use App\Models\Tramite;
use App\Services\ModificacionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ModificacionController extends Controller
{
    public function __construct(
        private readonly ModificacionService $modificacionService,
    ) {}

    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'estado' => ['nullable', Rule::in(Modificacion::ESTADOS)],
            'tipo' => ['nullable', Rule::in(Modificacion::TIPOS)],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $usuario = $request->user();

        return Inertia::render('Modificaciones/Index', [
            'modificaciones' => ModificacionResource::collection(
                $this->modificacionService->listar($filtros, $usuario)
            ),
            'puede_resolver' => $usuario->hasPermission('modificaciones', 'resolucion'),
            'filtros' => [
                'estado' => $filtros['estado'] ?? '',
                'tipo' => $filtros['tipo'] ?? '',
                'search' => $filtros['search'] ?? '',
            ],
        ]);
    }

    public function store(StoreModificacionRequest $request): RedirectResponse
    {
        $tramite = Tramite::findOrFail($request->integer('tramite_id'));

        $this->modificacionService->solicitar(
            $tramite,
            $request->user(),
            (string) $request->input('tipo'),
            (string) $request->input('motivo'),
            $request->input('propuesta'),
        );

        $mensaje = $request->input('tipo') === Modificacion::TIPO_BAJA
            ? 'Solicitud de baja registrada. Podrás dar de baja el trámite cuando sea aprobada.'
            : 'Solicitud de modificación registrada. Podrás editar el trámite cuando sea aprobada.';

        return back()->with('success', $mensaje);
    }

    public function aprobar(ResolverModificacionRequest $request, Modificacion $modificacion): RedirectResponse
    {
        $this->modificacionService->aprobar(
            $modificacion,
            $request->user(),
            $request->input('glosa_respuesta'),
        );

        return back()->with('success', 'Solicitud aprobada. El solicitante ya puede aplicar el cambio.');
    }

    public function rechazar(RechazarModificacionRequest $request, Modificacion $modificacion): RedirectResponse
    {
        $this->modificacionService->rechazar(
            $modificacion,
            $request->user(),
            $request->input('glosa_respuesta'),
        );

        return back()->with('success', 'Solicitud rechazada.');
    }

    public function cancelar(Request $request, Modificacion $modificacion): RedirectResponse
    {
        $this->modificacionService->cancelar($modificacion, $request->user());

        return back()->with('success', 'Solicitud cancelada.');
    }
}
