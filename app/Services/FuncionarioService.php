<?php

namespace App\Services;

use App\Models\Funcionario;
use App\Models\FuncionarioPuesto;
use Illuminate\Pagination\LengthAwarePaginator;

class FuncionarioService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Funcionario::with('puesto')
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where('nombre', 'like', "%{$v}%"))
            ->orderBy('nombre')
            ->paginate(10);
    }

    public function crear(array $data): Funcionario
    {
        $funcionario = Funcionario::create([
            'nombre' => $data['nombre'],
            'email' => $data['email'] ?? null,
            'puesto_id' => $data['puesto_id'],
        ]);

        FuncionarioPuesto::create([
            'funcionario_id' => $funcionario->id,
            'puesto_id' => $data['puesto_id'],
            'fecha_inicio' => now()->toDateString(),
        ]);

        return $funcionario->load('puesto');
    }

    public function actualizar(Funcionario $funcionario, array $data): Funcionario
    {
        $puestoCambio = isset($data['puesto_id']) && $data['puesto_id'] != $funcionario->puesto_id;

        $funcionario->update([
            'nombre' => $data['nombre'],
            'email' => $data['email'] ?? $funcionario->email,
            'puesto_id' => $data['puesto_id'] ?? $funcionario->puesto_id,
        ]);

        if ($puestoCambio) {
            $historialActivo = FuncionarioPuesto::where('funcionario_id', $funcionario->id)
                ->whereNull('fecha_fin')
                ->latest()
                ->first();

            if ($historialActivo) {
                $historialActivo->update(['fecha_fin' => now()->toDateString()]);
            }

            FuncionarioPuesto::create([
                'funcionario_id' => $funcionario->id,
                'puesto_id' => $data['puesto_id'],
                'fecha_inicio' => now()->toDateString(),
            ]);
        }

        return $funcionario->load('puesto');
    }

    public function eliminar(Funcionario $funcionario): void
    {
        $funcionario->delete();
    }

    public function obtenerTodos()
    {
        return Funcionario::with('puesto')->orderBy('nombre')->get();
    }
}
