<?php

namespace App\Http\Resources;

use App\Models\Area;
use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $persona = $this->relationLoaded('persona') ? $this->persona : null;

        return [
            'id' => $this->id,
            'name' => $this->nombre_completo,
            'username' => $this->username,
            'email' => $this->email,
            'persona_id' => $this->persona_id,
            'activo' => (bool) $this->activo,
            'persona' => $this->whenLoaded('persona', fn () => $persona ? new PersonaResource($persona) : null),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn (Rol $r) => [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'slug' => $r->slug,
                'permiso_ids' => $r->permisos->pluck('id'),
            ])),
            'puesto_activo' => $this->when(
                $persona !== null && $persona->relationLoaded('puestoActivo') && $persona->puestoActivo,
                fn () => new PersonaPuestoResource($persona->puestoActivo),
            ),
            'historial_puestos' => $this->when(
                $persona !== null && $persona->relationLoaded('historialPuestos'),
                fn () => PersonaPuestoResource::collection($persona->historialPuestos),
            ),
            'areas' => $this->whenLoaded('areasHabilitadas', fn () => $this->areasHabilitadas->map(fn (Area $area) => [
                'id' => $area->id,
                'nombre' => $area->nombre,
                'codigo' => $area->codigo,
                'predeterminada' => (bool) $area->pivot->predeterminada,
            ])->values()),
            'area_ids' => $this->whenLoaded('areasHabilitadas', fn () => $this->areasHabilitadas->pluck('id')->values()),
            'area_predeterminada_id' => $this->whenLoaded('areasHabilitadas', function () {
                $area = $this->areasHabilitadas->first(fn (Area $area) => (bool) $area->pivot->predeterminada);

                return $area?->id;
            }),
            'permisos_overrides' => $this->whenLoaded('permisosDirectos', fn () => $this->permisosDirectos
                ->map(fn (Permiso $permiso) => [
                    'permiso_id' => $permiso->id,
                    'permitido' => (bool) $permiso->pivot->permitido,
                    'modulo' => $permiso->modulo->slug,
                    'accion' => $permiso->accion->slug,
                ])
                ->values()),
        ];
    }
}
