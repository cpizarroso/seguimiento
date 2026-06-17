<?php

namespace App\Services;

use App\Models\Puesto;
use Illuminate\Pagination\LengthAwarePaginator;

class PuestoService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Puesto::with('area')
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where('nombre', 'like', "%{$v}%"))
            ->orderBy('nombre')
            ->paginate(10);
    }

    public function obtenerTodos()
    {
        return Puesto::with('area')->orderBy('nombre')->get();
    }

    public function crear(array $data): Puesto
    {
        return Puesto::create($data);
    }

    public function actualizar(Puesto $puesto, array $data): Puesto
    {
        $puesto->update($data);
        return $puesto;
    }

    public function eliminar(Puesto $puesto): void
    {
        $puesto->delete();
    }
}
