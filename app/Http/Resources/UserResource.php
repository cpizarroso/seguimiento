<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (!$this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'funcionario' => $this->whenLoaded('funcionario')
                ? ['id' => $this->funcionario->id, 'nombre' => $this->funcionario->nombre]
                : null,
        ];
    }
}
