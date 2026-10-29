<?php

namespace App\Services;

use App\Models\Reseteo;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UserService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return User::query()
            ->with([
                'persona.puestoActivo.puesto.area',
                'roles',
                'areasHabilitadas',
                'permisosDirectos.permiso.modulo',
                'permisosDirectos.permiso.accion',
            ])
            ->leftJoin('personas', 'personas.id', '=', 'users.persona_id')
            ->select('users.*')
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $terminos = preg_split('/\s+/', trim($v), -1, PREG_SPLIT_NO_EMPTY) ?: [];

                if ($terminos === []) {
                    return;
                }

                $q->where(function ($query) use ($terminos) {
                    foreach ($terminos as $termino) {
                        $query->where(function ($sub) use ($termino) {
                            $sub->where('users.username', 'like', "%{$termino}%")
                                ->orWhere('users.email', 'like', "%{$termino}%")
                                ->orWhere('personas.nombres', 'like', "%{$termino}%")
                                ->orWhere('personas.apellidos', 'like', "%{$termino}%")
                                ->orWhere('personas.ci', 'like', "%{$termino}%")
                                ->orWhere('personas.correo', 'like', "%{$termino}%")
                                ->orWhere('personas.telefono', 'like', "%{$termino}%")
                                ->orWhere('personas.profesion', 'like', "%{$termino}%");
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
            ->orderBy('personas.apellidos')
            ->orderBy('personas.nombres')
            ->orderBy('users.email')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data): User
    {
        $roleIds = $data['role_ids'] ?? [];
        $permisos = $data['permisos'] ?? [];
        unset($data['role_ids'], $data['permisos']);

        return DB::transaction(function () use ($data, $roleIds, $permisos) {
            $user = User::create([
                'username' => $data['username'] ?? User::usernameDesdeEmail($data['email']),
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'persona_id' => $data['persona_id'],
            ]);

            $user->roles()->sync($roleIds);
            $this->sincronizarAreasHabilitadas($user, $data);
            $this->sincronizarPermisosDirectos($user, $permisos);

            return $user;
        });
    }

    public function actualizar(User $user, array $data): User
    {
        $roleIds = $data['role_ids'] ?? [];
        $permisos = $data['permisos'] ?? [];
        unset($data['role_ids'], $data['permisos']);

        return DB::transaction(function () use ($user, $data, $roleIds, $permisos) {
            $updateData = [
                'username' => $data['username'] ?? User::usernameDesdeEmail($data['email']),
                'email' => $data['email'],
                'persona_id' => $data['persona_id'],
            ];

            if (! empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);
            $user->roles()->sync($roleIds);
            $this->sincronizarAreasHabilitadas($user, $data);
            $this->sincronizarPermisosDirectos($user, $permisos);

            return $user;
        });
    }

    /**
     * Sincroniza los permisos concedidos o denegados por encima del rol.
     *
     * @param  array<int, array{permiso_id?: mixed, permitido?: mixed}>  $permisos
     */
    private function sincronizarPermisosDirectos(User $user, array $permisos): void
    {
        $sync = [];

        foreach ($permisos as $permiso) {
            $permisoId = (int) ($permiso['permiso_id'] ?? 0);

            if ($permisoId <= 0) {
                continue;
            }

            $sync[$permisoId] = ['permitido' => (bool) ($permiso['permitido'] ?? false)];
        }

        $user->permisosDirectos()->sync($sync);
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
        return User::with([
            'persona.puestoActivo.puesto.area',
            'persona.historialPuestos.puesto.area',
            'roles',
            'areasHabilitadas',
            'permisosDirectos.permiso.modulo',
            'permisosDirectos.permiso.accion',
        ])->findOrFail($id);
    }

    public function resetPassword(User $user, string $password, ?string $exceptSessionId = null): void
    {
        $user->update([
            'password' => Hash::make($password),
            'remember_token' => Str::random(60),
        ]);

        Reseteo::create([
            'user_id' => $user->id,
            'reset_por' => auth()->id(),
        ]);

        $user->tokens()->delete();

        // Obliga al usuario a iniciar sesión de nuevo en sus otras sesiones.
        $this->cerrarSesiones($user, $exceptSessionId);
    }

    public function cambiarEstado(User $user, bool $activo): User
    {
        $user->update([
            'activo' => $activo,
            'remember_token' => $activo ? $user->remember_token : Str::random(60),
        ]);

        if (! $activo) {
            $user->tokens()->delete();
            $this->cerrarSesiones($user);
        }

        return $user;
    }

    /**
     * Elimina las sesiones del usuario cuando la tabla existe.
     * Permite conservar la sesión del administrador que hace el cambio.
     */
    public function cerrarSesiones(User $user, ?string $exceptSessionId = null): void
    {
        $tabla = (string) config('session.table', 'sessions');

        if (! Schema::hasTable($tabla)) {
            return;
        }

        DB::table($tabla)
            ->where('user_id', $user->id)
            ->when($exceptSessionId, fn ($query) => $query->where('id', '!=', $exceptSessionId))
            ->delete();
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
