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
            'year' => $this->year,
            'fecha' => $this->fecha?->format('d/m/Y'),
            'descripcion' => $this->descripcion,
            'numero_diamante' => $this->numero_diamante,
            'glosa' => $this->glosa,
            'estado' => $this->estado,
            'ultima_respuesta' => $this->ultima_respuesta,
            'puesto' => new PuestoResource($this->whenLoaded('puesto')),
            'creador' => new FuncionarioResource($this->whenLoaded('creador')),
            'asignado' => new FuncionarioResource($this->whenLoaded('asignado')),
            'derivaciones' => DerivacionResource::collection($this->whenLoaded('derivaciones')),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
