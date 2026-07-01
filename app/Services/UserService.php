<?php

namespace App\Services;

use App\Models\Reseteo;
use App\Models\User;
use App\Models\UserPuesto;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return User::with(['funcionario', 'puestoActivo.puesto.area', 'roles'])
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('name', 'like', "%{$v}%")
                        ->orWhere('email', 'like', "%{$v}%");
                });
            })
            ->orderBy('name')
            ->paginate(10);
    }

    public function crear(array $data): User
    {
        $puestoId = $data['puesto_id'] ?? null;
        $roleIds = $data['role_ids'] ?? [];
        unset($data['puesto_id'], $data['role_ids']);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'profesion' => $data['profesion'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'user',
            'funcionario_id' => $data['funcionario_id'] ?? null,
        ]);

        if (! empty($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        if ($puestoId) {
            UserPuesto::create([
                'user_id' => $user->id,
                'puesto_id' => $puestoId,
                'fecha_inicio' => now()->toDateString(),
            ]);
        }

        return $user;
    }

    public function actualizar(User $user, array $data): User
    {
        $puestoId = $data['puesto_id'] ?? null;
        $roleIds = $data['role_ids'] ?? [];
        unset($data['puesto_id'], $data['role_ids']);

        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? $user->phone,
            'profesion' => $data['profesion'] ?? $user->profesion,
            'funcionario_id' => $data['funcionario_id'] ?? $user->funcionario_id,
        ];

        if (! empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (isset($roleIds)) {
            $user->roles()->sync($roleIds);
        }

        $puestoActivo = $user->puestoActivo;

        if ($puestoId) {
            if ($puestoActivo && $puestoActivo->puesto_id !== (int) $puestoId) {
                $puestoActivo->update(['fecha_fin' => now()->toDateString()]);

                UserPuesto::create([
                    'user_id' => $user->id,
                    'puesto_id' => $puestoId,
                    'fecha_inicio' => now()->toDateString(),
                ]);
            } elseif (! $puestoActivo) {
                UserPuesto::create([
                    'user_id' => $user->id,
                    'puesto_id' => $puestoId,
                    'fecha_inicio' => now()->toDateString(),
                ]);
            }
        } elseif ($puestoActivo) {
            $puestoActivo->update(['fecha_fin' => now()->toDateString()]);
        }

        return $user;
    }

    public function eliminar(User $user): void
    {
        $user->delete();
    }

    public function obtenerPorId(int $id): User
    {
        return User::with('funcionario')->findOrFail($id);
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
