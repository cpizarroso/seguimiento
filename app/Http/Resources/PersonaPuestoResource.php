<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonaPuestoResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'persona_id' => $this->persona_id,
            'puesto_id' => $this->puesto_id,
            'puesto' => $this->whenLoaded('puesto') ? new PuestoResource($this->puesto) : null,
            'fecha_inicio' => $this->fecha_inicio?->format('d/m/Y'),
            'fecha_fin' => $this->fecha_fin?->format('d/m/Y'),
            'vigente' => $this->fecha_fin === null,
        ];
    }
}
