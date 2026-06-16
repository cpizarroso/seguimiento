<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DerivacionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (!$this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'numero_derivacion' => $this->numero_derivacion,
            'derivado_de' => $this->whenLoaded('de') ? new FuncionarioResource($this->de) : null,
            'derivado_a' => $this->whenLoaded('a') ? new FuncionarioResource($this->a) : null,
            'fecha_derivacion' => $this->fecha_derivacion?->format('d/m/Y H:i'),
            'glosa_derivacion' => $this->glosa_derivacion,
            'fecha_recepcion' => $this->fecha_recepcion?->format('d/m/Y H:i'),
            'glosa_recepcion' => $this->glosa_recepcion,
            'estado' => $this->estado,
            'dias_en_derivacion' => $this->dias_en_derivacion,
        ];
    }
}
