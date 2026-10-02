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
            'puesto_id' => $this->puesto_id,
            'puesto' => $this->whenLoaded('puesto', fn () => $this->puesto ? [
                'id' => $this->puesto->id,
                'nombre' => $this->puesto->nombre,
                'sigla' => $this->puesto->sigla,
                'codigo' => $this->puesto->codigo,
            ] : null),
            'creado_por' => $this->whenLoaded('creadoPor') ? new UserResource($this->creadoPor) : null,
        ];
    }
}
