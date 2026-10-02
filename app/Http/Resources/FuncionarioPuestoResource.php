<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FuncionarioPuestoResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'funcionario_id' => $this->funcionario_id,
            'puesto_id' => $this->puesto_id,
            'puesto' => $this->whenLoaded('puesto', fn () => $this->puesto ? [
                'id' => $this->puesto->id,
                'nombre' => $this->puesto->nombre,
                'sigla' => $this->puesto->sigla,
                'codigo' => $this->puesto->codigo,
            ] : null),
            'area_id' => $this->area_id,
            'area' => $this->whenLoaded('area', fn () => $this->area ? [
                'id' => $this->area->id,
                'nombre' => $this->area->nombre,
                'sigla' => $this->area->sigla,
            ] : null),
            'fecha_inicio' => $this->fecha_inicio?->format('d/m/Y'),
            'fecha_fin' => $this->fecha_fin?->format('d/m/Y'),
            'es_vigente' => $this->esVigente(),
            'creado_por' => $this->whenLoaded('creadoPor') ? new UserResource($this->creadoPor) : null,
        ];
    }
}
