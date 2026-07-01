<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TramiteResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero_tramite' => $this->numero_tramite,
            'numero_formateado' => $this->numero_formateado,
            'numero_completo' => $this->numero_completo,
            'year' => $this->year,
            'fecha' => $this->fecha?->format('d/m/Y'),
            'descripcion' => $this->descripcion,
            'numero_diamante' => $this->numero_diamante,
            'estado' => $this->estado,
            'ultima_respuesta' => $this->ultima_respuesta,
            'glosa_finalizacion' => $this->glosa_finalizacion,
            'fecha_finalizacion' => $this->fecha_finalizacion?->format('d/m/Y H:i'),
            'finalizado_por' => $this->whenLoaded('finalizadoPor') ? new UserResource($this->finalizadoPor) : null,
            'area' => new AreaResource($this->whenLoaded('area')),
            'area_id' => $this->area_id,
            'creador' => new UserResource($this->whenLoaded('creador')),
            'asignado' => new UserResource($this->whenLoaded('asignado')),
            'derivaciones' => DerivacionResource::collection($this->whenLoaded('derivaciones')),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'dias_transcurridos' => $this->dias_transcurridos,
        ];
    }
}
