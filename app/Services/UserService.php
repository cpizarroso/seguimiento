<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return User::with('funcionario')
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('name', 'like', "%{$v}%")
                        ->orWhere('email', 'like', "%{$v}%")
                        ->orWhere('username', 'like', "%{$v}%");
                });
            })
            ->orderBy('name')
            ->paginate(15);
    }

    public function crear(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'] ?? null,
            'phone' => $data['phone'] ?? null,
            'profesion' => $data['profesion'] ?? null,
            'cargo' => $data['cargo'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'user',
            'funcionario_id' => $data['funcionario_id'] ?? null,
        ]);
    }

    public function actualizar(User $user, array $data): User
    {
        $updateData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'username' => $data['username'] ?? $user->username,
            'phone' => $data['phone'] ?? $user->phone,
            'profesion' => $data['profesion'] ?? $user->profesion,
            'cargo' => $data['cargo'] ?? $user->cargo,
            'role' => $data['role'] ?? $user->role,
            'funcionario_id' => $data['funcionario_id'] ?? $user->funcionario_id,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        return $user->fresh();
    }

    public function eliminar(User $user): void
    {
        $user->delete();
    }

    public function obtenerPorId(int $id): User
    {
        return User::with('funcionario')->findOrFail($id);
    }
}
