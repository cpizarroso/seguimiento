<?php

namespace App\Http\Resources;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'profesion' => $this->profesion,
            'role' => $this->role,
            'funcionario' => $this->whenLoaded('funcionario', fn () => [
                'id' => $this->funcionario->id,
                'nombre' => $this->funcionario->nombre,
            ]),
            'role' => $this->role,
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn (Rol $r) => [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'slug' => $r->slug,
                'permiso_ids' => $r->permisos->pluck('id'),
            ])),
            'puesto_activo' => $this->whenLoaded('puestoActivo', fn () => [
                'id' => $this->puestoActivo->id,
                'puesto_id' => $this->puestoActivo->puesto_id,
                'puesto' => $this->puestoActivo->puesto ? new PuestoResource($this->puestoActivo->puesto) : null,
            ]),
            'historial_puestos' => $this->whenLoaded('historialPuestos', fn () => $this->historialPuestos->map(fn ($up) => [
                'id' => $up->id,
                'puesto_id' => $up->puesto_id,
                'puesto' => $up->puesto ? new PuestoResource($up->puesto) : null,
                'fecha_inicio' => $up->fecha_inicio?->format('d/m/Y'),
                'fecha_fin' => $up->fecha_fin?->format('d/m/Y'),
            ]),
            ),
        ];
    }
}
