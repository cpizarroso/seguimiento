<?php

namespace App\Http\Resources;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Rol */
class RolResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'descripcion' => $this->descripcion,
            'es_sistema' => $this->es_sistema,
            'permiso_ids' => $this->permisos->pluck('id')->toArray(),
            'permisos' => $this->permisos->map(fn ($p) => [
                'id' => $p->id,
                'modulo' => $p->modulo->slug,
                'accion' => $p->accion->slug,
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
