<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'sigla' => $this->sigla,
            'estado' => $this->estado,
            'puestos_count' => $this->whenCounted('puestos'),
            'puestos' => PuestoResource::collection($this->whenLoaded('puestos')),
            'created_at' => $this->created_at,
        ];
    }
}
