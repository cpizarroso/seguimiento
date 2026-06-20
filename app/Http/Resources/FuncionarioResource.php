<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuncionarioResource extends JsonResource
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
            'direccion' => $this->direccion,
            'nro_telefono' => $this->nro_telefono,
            'cedula_identidad' => $this->cedula_identidad,
            'tipo_funcionario' => $this->tipo_funcionario,
            'nivel' => $this->nivel,
            'fecha_ingreso' => $this->fecha_ingreso?->format('d/m/Y'),
            'estado' => $this->estado,
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area') ? new AreaResource($this->area) : null,
            'creado_por' => $this->whenLoaded('creadoPor') ? new UserResource($this->creadoPor) : null,
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
