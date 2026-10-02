<?php

namespace App\Http\Controllers\Actuaciones;

use App\Http\Controllers\Controller;
use App\Http\Requests\Actuaciones\StoreActuacionRequest;
use App\Models\Actuacion;
use App\Models\Tramite;
use App\Services\ActuacionService;
use Illuminate\Http\RedirectResponse;

class ActuacionController extends Controller
{
    public function __construct(
        private readonly ActuacionService $actuacionService,
    ) {}

    public function store(StoreActuacionRequest $request, Tramite $tramite): RedirectResponse
    {
        abort_if($tramite->estado === 'finalizado', 403, 'No se puede registrar actuaciones en un trámite finalizado.');

        $this->actuacionService->crear($tramite, $request->validated());

        return to_route('tramites.show', $tramite)
            ->with('success', 'Actuación registrada exitosamente.');
    }

    public function destroy(Actuacion $actuacion): RedirectResponse
    {
        $tramiteId = $actuacion->tramite_id;

        $this->actuacionService->eliminar($actuacion);

        return to_route('tramites.show', $tramiteId)
            ->with('success', 'Actuación eliminada exitosamente.');
    }
}
