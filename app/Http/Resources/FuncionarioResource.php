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
            'puesto_id' => $this->puesto_id,
            'puesto' => $this->whenLoaded('puesto', fn () => $this->puesto ? [
                'id' => $this->puesto->id,
                'nombre' => $this->puesto->nombre,
                'sigla' => $this->puesto->sigla,
                'codigo' => $this->puesto->codigo,
            ] : null),
            'creado_por' => $this->whenLoaded('creadoPor') ? new UserResource($this->creadoPor) : null,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'name' => $this->usuario->name,
                'email' => $this->usuario->email,
            ]),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'updated_at' => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}
