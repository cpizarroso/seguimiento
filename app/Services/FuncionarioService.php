<?php

namespace App\Services;

use App\Models\Funcionario;
use Illuminate\Pagination\LengthAwarePaginator;

class FuncionarioService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Funcionario::with('area')
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('nombre', 'like', "%{$v}%")
                  ->orWhere('apellidos', 'like', "%{$v}%")
                  ->orWhere('cedula_identidad', 'like', "%{$v}%");
            }))
            ->orderBy('nombre')
            ->paginate(10);
    }

    public function crear(array $data): Funcionario
    {
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

    public function obtenerTodos()
    {
        return Funcionario::with('area')->orderBy('nombre')->get();
    }
}
