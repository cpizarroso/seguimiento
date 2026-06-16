<?php

namespace App\Http\Controllers\Derivaciones;

use App\Http\Controllers\Controller;
use App\Http\Requests\Derivaciones\DerivarTramiteRequest;
use App\Http\Requests\Derivaciones\RecepcionarDerivacionRequest;
use App\Http\Requests\Derivaciones\RechazarDerivacionRequest;
use App\Models\Derivacion;
use App\Models\Tramite;
use App\Services\DerivacionService;
use Illuminate\Http\RedirectResponse;

class DerivacionController extends Controller
{
    public function __construct(
        private readonly DerivacionService $derivacionService,
    ) {}

    public function derivar(DerivarTramiteRequest $request, Tramite $tramite): RedirectResponse
    {
        $funcionarioId = $request->user()?->funcionario?->id;

        abort_if(!$funcionarioId || $tramite->derivado_a !== $funcionarioId, 403,
            'No tienes permiso para derivar este trámite.');

        $this->derivacionService->derivar(
            $tramite,
            $request->input('derivado_a'),
            $request->input('glosa_derivacion'),
        );

        return to_route('tramites.show', $tramite)
            ->with('success', 'Trámite derivado exitosamente.');
    }

    public function recepcionar(RecepcionarDerivacionRequest $request, Derivacion $derivacion): RedirectResponse
    {
        $funcionarioId = $request->user()?->funcionario?->id;

        abort_if(!$funcionarioId || $derivacion->derivado_a !== $funcionarioId, 403,
            'No tienes permiso para recepcionar esta derivación.');

        $this->derivacionService->recepcionar(
            $derivacion,
            $request->input('glosa_recepcion'),
        );

        return to_route('tramites.show', $derivacion->tramite_id)
            ->with('success', 'Derivación recepcionada exitosamente.');
    }

    public function rechazar(RechazarDerivacionRequest $request, Derivacion $derivacion): RedirectResponse
    {
        $funcionarioId = $request->user()?->funcionario?->id;

        abort_if(!$funcionarioId || $derivacion->derivado_a !== $funcionarioId, 403,
            'No tienes permiso para rechazar esta derivación.');

        $this->derivacionService->rechazar(
            $derivacion,
            $request->input('glosa_rechazo'),
        );

        return to_route('tramites.show', $derivacion->tramite_id)
            ->with('success', 'Derivación rechazada exitosamente.');
    }
}
