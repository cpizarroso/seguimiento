<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
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
            'codigo' => $this->codigo,
            'descripcion' => $this->descripcion,
            'activo' => (bool) $this->activo,
            'area_padre_id' => $this->area_padre_id,
            'user_id' => $this->user_id,
            'responsable' => $this->whenLoaded('responsable', fn () => $this->responsable ? [
                'id' => $this->responsable->id,
                'name' => $this->responsable->name,
                'email' => $this->responsable->email,
            ] : null),
            'puestos_count' => $this->whenCounted('puestos'),
            'children_count' => $this->whenCounted('children'),
            'predeterminada' => $this->whenPivotLoaded('area_user', fn () => (bool) $this->pivot->predeterminada),
            'puestos' => $this->whenLoaded('puestos', fn () => PuestoResource::collection($this->puestos)),
            'children' => $this->whenLoaded('children', fn () => AreaResource::collection($this->children)),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}
