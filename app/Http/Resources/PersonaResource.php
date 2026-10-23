<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PersonaResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        if (! $this->resource) {
            return [];
        }

        return [
            'id' => $this->id,
            'nombres' => $this->nombres,
            'apellidos' => $this->apellidos,
            'nombre_completo' => $this->nombre_completo,
            'ci' => $this->ci,
            'telefono' => $this->telefono,
            'correo' => $this->correo,
            'direccion' => $this->direccion,
            'activo' => (bool) $this->activo,
            'puesto_activo' => $this->whenLoaded('puestoActivo', fn () => $this->puestoActivo ? new PersonaPuestoResource($this->puestoActivo) : null),
            'area' => $this->whenLoaded('puestoActivo', fn () => $this->puestoActivo?->puesto?->area ? [
                'id' => $this->puestoActivo->puesto->area->id,
                'nombre' => $this->puestoActivo->puesto->area->nombre,
                'codigo' => $this->puestoActivo->puesto->area->codigo,
            ] : null),
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null),
            'historial_puestos' => $this->whenLoaded('historialPuestos', fn () => PersonaPuestoResource::collection($this->historialPuestos)),
            'created_at' => $this->created_at?->format('d/m/Y'),
        ];
    }
}
