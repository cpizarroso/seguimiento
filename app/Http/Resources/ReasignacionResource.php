<?php

namespace App\Http\Resources;

use App\Models\Reasignacion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReasignacionResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'estado' => $this->estado,
            'motivo' => $this->motivo,
            'glosa_respuesta' => $this->glosa_respuesta,
            'fecha_resolucion' => $this->fecha_resolucion?->format('d/m/Y H:i'),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'derivacion_id' => $this->derivacion_id,
            'puede_cancelar' => $this->estado === Reasignacion::ESTADO_PENDIENTE
                && (int) $this->solicitante_id === (int) $request->user()?->id,
            'tramite' => $this->whenLoaded('tramite', fn () => [
                'id' => $this->tramite->id,
                'numero_completo' => $this->tramite->numero_completo,
                'descripcion' => $this->tramite->descripcion,
                'estado' => $this->tramite->estado,
                'area' => $this->tramite->area?->nombre,
                'asignado' => $this->tramite->asignado?->nombre_completo,
            ]),
            'solicitante' => $this->whenLoaded('solicitante', fn () => [
                'id' => $this->solicitante->id,
                'name' => $this->solicitante->nombre_completo,
            ]),
            'resuelto_por' => $this->whenLoaded('resueltoPor', fn () => $this->resueltoPor ? [
                'id' => $this->resueltoPor->id,
                'name' => $this->resueltoPor->nombre_completo,
            ] : null),
        ];
    }
}
