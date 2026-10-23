<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PuestoResource extends JsonResource
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
            'codigo' => $this->codigo,
            'descripcion' => $this->descripcion,
            'activo' => (bool) $this->activo,
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area') ? new AreaResource($this->area) : null,
            'personas_count' => $this->whenCounted('personaPuestos'),
            'usuarios_count' => $this->when(isset($this->usuarios_count), fn () => (int) $this->usuarios_count),
            'created_at' => $this->created_at,
        ];
    }
}
