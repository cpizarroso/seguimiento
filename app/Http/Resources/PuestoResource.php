<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PuestoResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (!$this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'sigla' => $this->sigla,
            'estado' => $this->estado,
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area') ? new AreaResource($this->area) : null,
            'funcionarios_count' => $this->whenCounted('funcionarios'),
            'created_at' => $this->created_at,
        ];
    }
}
