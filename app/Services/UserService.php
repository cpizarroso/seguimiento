<?php

namespace App\Services;

use App\Models\Reseteo;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return User::with(['persona.puestoActivo.puesto.area', 'roles', 'areasHabilitadas'])
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $terminos = preg_split('/\s+/', trim($v), -1, PREG_SPLIT_NO_EMPTY) ?: [];

                $q->where(function ($query) use ($v, $terminos) {
                    $query->where(function ($usuario) use ($v) {
                        $usuario->where('name', 'like', "%{$v}%")
                            ->orWhere('email', 'like', "%{$v}%")
                            ->orWhere('phone', 'like', "%{$v}%")
                            ->orWhere('profesion', 'like', "%{$v}%");
                    });

                    if (! empty($terminos)) {
                        $query->orWhere(function ($personaQuery) use ($terminos) {
                            $personaQuery->whereHas('persona', function ($persona) use ($terminos) {
                                foreach ($terminos as $termino) {
                                    $persona->where(function ($sub) use ($termino) {
                                        $sub->where('nombres', 'like', "%{$termino}%")
                                            ->orWhere('apellidos', 'like', "%{$termino}%")
                                            ->orWhere('ci', 'like', "%{$termino}%");
                                    });
                                }
                            });
                        });
                    }
                });
            })
            ->when($filtros['role_id'] ?? null, function ($q, $v) {
                $q->whereHas('roles', fn ($roles) => $roles->where('roles.id', $v));
            })
            ->when($filtros['area_id'] ?? null, function ($q, $v) {
                $q->whereHas('persona.puestoActivo.puesto', fn ($puesto) => $puesto->where('area_id', $v));
            })
            ->when(
                isset($filtros['con_persona']) && $filtros['con_persona'] !== '' && $filtros['con_persona'] !== null,
                function ($q) use ($filtros) {
                    if (filter_var($filtros['con_persona'], FILTER_VALIDATE_BOOLEAN)) {
                        $q->whereNotNull('persona_id');
                    } else {
                        $q->whereNull('persona_id');
                    }
                }
            )
            ->orderBy('name')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data): User
    {
        $roleIds = $data['role_ids'] ?? [];
        unset($data['role_ids']);

        return DB::transaction(function () use ($data, $roleIds) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'profesion' => $data['profesion'] ?? null,
                'password' => Hash::make($data['password']),
                'role' => 'user',
                'persona_id' => $data['persona_id'] ?? null,
            ]);

            $user->roles()->sync($roleIds);
            $this->sincronizarAreasHabilitadas($user, $data);

            return $user;
        });
    }

    public function actualizar(User $user, array $data): User
    {
        $roleIds = $data['role_ids'] ?? [];
        unset($data['role_ids']);

        return DB::transaction(function () use ($user, $data, $roleIds) {
            $updateData = [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? $user->phone,
                'profesion' => $data['profesion'] ?? $user->profesion,
                'persona_id' => $data['persona_id'] ?? $user->persona_id,
            ];

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);
            $user->roles()->sync($roleIds);
            $this->sincronizarAreasHabilitadas($user, $data);

            return $user;
        });
    }

    /**
     * Sincroniza las áreas habilitadas y garantiza una sola predeterminada.
     *
     * @param  array<string, mixed>  $data
     */
    private function sincronizarAreasHabilitadas(User $user, array $data): void
    {
        if (! array_key_exists('area_ids', $data) && ! array_key_exists('area_predeterminada_id', $data)) {
            return;
        }

        $areaIds = array_values(array_unique(array_map('intval', (array) ($data['area_ids'] ?? []))));

        $predeterminada = $data['area_predeterminada_id'] ?? null;
        $predeterminada = ($predeterminada !== null && $predeterminada !== '') ? (int) $predeterminada : null;

        if ($predeterminada === null || ! in_array($predeterminada, $areaIds, true)) {
            $predeterminada = $areaIds[0] ?? null;
        }

        // Primero se quitan todas las predeterminadas para no romper el índice único.
        $sync = [];
        foreach ($areaIds as $id) {
            $sync[$id] = ['predeterminada' => false];
        }

        $user->areasHabilitadas()->sync($sync);

        if ($predeterminada !== null) {
            $user->areasHabilitadas()->updateExistingPivot($predeterminada, ['predeterminada' => true]);
        }
    }

    public function eliminar(User $user): void
    {
        $user->delete();
    }

    public function obtenerPorId(int $id): User
    {
        return User::with(['persona.puestoActivo.puesto.area', 'persona.historialPuestos.puesto.area', 'roles', 'areasHabilitadas'])
            ->findOrFail($id);
    }

    public function resetPassword(User $user, string $password): void
    {
        $user->update([
            'password' => Hash::make($password),
        ]);

        Reseteo::create([
            'user_id' => $user->id,
            'reset_por' => auth()->id(),
        ]);

        $user->tokens()->delete();
    }

    public function getSetting(User $user, string $key, mixed $default = null): mixed
    {
        return $user->settings[$key] ?? $default;
    }

    public function setSetting(User $user, string $key, mixed $value): void
    {
        $settings = $user->settings ?? [];
        $settings[$key] = $value;
        $user->update(['settings' => $settings]);
    }

    public function getPerPage(User $user): int
    {
        return (int) ($user->settings['per_page'] ?? 10);
    }
}
