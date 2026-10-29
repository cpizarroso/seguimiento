<?php

namespace App\Http\Requests\Concerns;

use App\Models\Permiso;
use App\Models\User;
use Illuminate\Validation\Validator;

trait ValidaPermisosDirectos
{
    /**
     * Reglas de los permisos concedidos/denegados por encima del rol.
     *
     * @return array<string, mixed>
     */
    protected function reglasPermisosDirectos(): array
    {
        return [
            'permisos' => ['nullable', 'array'],
            'permisos.*.permiso_id' => ['required', 'integer', 'distinct', 'exists:permisos,id'],
            'permisos.*.permitido' => ['required', 'boolean'],
        ];
    }

    /**
     * Evita que un usuario se quite a sí mismo el acceso a la edición de
     * usuarios o roles, dejándolo sin forma de revertirlo.
     */
    protected function protegerAutoBloqueo(Validator $validator): void
    {
        $objetivo = $this->route('user');
        $actual = $this->user();

        if (! $objetivo instanceof User || ! $actual instanceof User || ! $objetivo->is($actual)) {
            return;
        }

        $protegidos = Permiso::query()
            ->whereHas('modulo', fn ($query) => $query->whereIn('slug', ['usuarios', 'roles']))
            ->whereHas('accion', fn ($query) => $query->where('slug', 'edicion'))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if ($protegidos === []) {
            return;
        }

        foreach ((array) $this->input('permisos', []) as $indice => $permiso) {
            $permisoId = (int) ($permiso['permiso_id'] ?? 0);

            if (in_array($permisoId, $protegidos, true) && ! filter_var($permiso['permitido'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $validator->errors()->add(
                    "permisos.{$indice}.permitido",
                    'No puedes quitarte a ti mismo el permiso de edición de usuarios o roles.',
                );
            }
        }
    }
}
