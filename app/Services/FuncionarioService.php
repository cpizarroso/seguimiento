<?php

namespace App\Services;

use App\Models\Funcionario;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class FuncionarioService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Funcionario::with('area')
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $palabras = preg_split('/\s+/', trim($v));
                foreach ($palabras as $palabra) {
                    $q->where(function ($q) use ($palabra) {
                        $q->where('nombre', 'like', "%{$palabra}%")
                            ->orWhere('apellidos', 'like', "%{$palabra}%")
                            ->orWhere('email', 'like', "%{$palabra}%")
                            ->orWhere('cedula_identidad', 'like', "%{$palabra}%");
                    });
                }
            }))
            ->when($filtros['area_id'] ?? null, fn ($q, $v) => $q->where('area_id', $v))
            ->orderBy('nombre')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data, ?User $user = null): Funcionario
    {
        $data['creado_por'] ??= $user?->id;

        return Funcionario::create($data)->load('area');
    }

    public function actualizar(Funcionario $funcionario, array $data): Funcionario
    {
        $funcionario->update($data);

        return $funcionario->load('area');
    }

    public function eliminar(Funcionario $funcionario): void
    {
        $funcionario->delete();
    }

    public function obtenerPorId(int $id): Funcionario
    {
        return Funcionario::with(['area', 'creadoPor'])
            ->findOrFail($id);
    }

    public function obtenerTodos()
    {
        return Funcionario::with('area')->orderBy('nombre')->get();
    }
}
