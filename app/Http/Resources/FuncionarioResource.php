<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuncionarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (!$this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'email' => $this->email,
            'puesto' => $this->whenLoaded('puesto') ? new PuestoResource($this->puesto) : null,
            'created_at' => $this->created_at,
        ];
    }
}
