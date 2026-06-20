<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuncionarioListResource extends JsonResource
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
            'apellidos' => $this->apellidos,
            'email' => $this->email,
            'cedula_identidad' => $this->cedula_identidad,
            'tipo_funcionario' => $this->tipo_funcionario,
            'nivel' => $this->nivel,
            'estado' => $this->estado,
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area') ? new AreaResource($this->area) : null,
            'creado_por' => $this->whenLoaded('creadoPor') ? new UserResource($this->creadoPor) : null,
        ];
    }
}
