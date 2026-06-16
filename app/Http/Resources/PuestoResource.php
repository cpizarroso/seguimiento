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
            'funcionarios_count' => $this->whenCounted('funcionarios'),
            'created_at' => $this->created_at,
        ];
    }
}
