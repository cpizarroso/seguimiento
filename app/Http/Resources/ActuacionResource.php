<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActuacionResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'tramite_id' => $this->tramite_id,
            'glosa' => $this->glosa,
            'fecha_actuacion' => $this->fecha_actuacion?->format('d/m/Y H:i'),
            'dias_transcurridos' => $this->dias_transcurridos,
            'area' => $this->whenLoaded('area') ? new AreaResource($this->area) : null,
            'area_id' => $this->area_id,
            'funcionario' => $this->whenLoaded('funcionario') ? new FuncionarioResource($this->funcionario) : null,
            'funcionario_id' => $this->funcionario_id,
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
