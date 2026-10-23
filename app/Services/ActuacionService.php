<?php

namespace App\Services;

use App\Models\Actuacion;
use App\Models\Derivacion;
use InvalidArgumentException;

class ActuacionService
{
    public function crear(Derivacion $derivacion, array $data, int $actorId): Actuacion
    {
        if ($derivacion->estado !== 'recepcionado' || $derivacion->derivado_a !== $actorId) {
            throw new InvalidArgumentException('Solo puedes registrar actuaciones en derivaciones recepcionadas por ti.');
        }

        // El área es la del trámite y la persona la vinculada al usuario que lo tiene asignado.
        $tramite = $derivacion->tramite;

        $personaId = $tramite->asignado?->persona_id
            ?? $derivacion->a?->persona_id;

        $actuacion = Actuacion::create([
            'derivacion_id' => $derivacion->id,
            'area_id' => $tramite->area_id,
            'persona_id' => $personaId,
            'glosa' => $data['glosa'],
            'fecha_actuacion' => now(),
        ]);

        return $actuacion->refresh()->load(['area', 'persona.puestoActivo.puesto.area']);
    }

    public function eliminar(Actuacion $actuacion): void
    {
        $actuacion->delete();
    }
}
