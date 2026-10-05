<?php

namespace App\Http\Controllers\Actuaciones;

use App\Http\Controllers\Controller;
use App\Http\Requests\Actuaciones\StoreActuacionRequest;
use App\Models\Actuacion;
use App\Models\Derivacion;
use App\Services\ActuacionService;
use Illuminate\Http\RedirectResponse;

class ActuacionController extends Controller
{
    public function __construct(
        private readonly ActuacionService $actuacionService,
    ) {}

    public function store(StoreActuacionRequest $request, Derivacion $derivacion): RedirectResponse
    {
        $tramite = $derivacion->tramite;

        abort_if($tramite->estado === 'finalizado', 403, 'No se puede registrar actuaciones en un trámite finalizado.');
        abort_if(
            $derivacion->estado !== 'recepcionado' || $derivacion->derivado_a !== $request->user()->id,
            403,
            'Solo puedes registrar actuaciones en derivaciones recepcionadas por ti.'
        );

        $this->actuacionService->crear($derivacion, $request->validated(), $request->user()->id);

        return to_route('tramites.show', $tramite)
            ->with('success', 'Actuación registrada exitosamente.');
    }

    public function destroy(Actuacion $actuacion): RedirectResponse
    {
        $tramiteId = $actuacion->derivacion->tramite_id;

        $this->actuacionService->eliminar($actuacion);

        return to_route('tramites.show', $tramiteId)
            ->with('success', 'Actuación eliminada exitosamente.');
    }
}
