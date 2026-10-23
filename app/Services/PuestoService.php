<?php

namespace App\Services;

use App\Models\Puesto;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class PuestoService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Puesto::with('area')
            ->withCount(['personaPuestos as personas_count' => fn ($q) => $q->whereNull('fecha_fin')])
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('nombre', 'like', "%{$v}%")
                    ->orWhere('codigo', 'like', "%{$v}%");
            }))
            ->when($filtros['area_id'] ?? null, fn ($q, $v) => $q->where('area_id', $v))
            ->when(isset($filtros['activo']) && $filtros['activo'] !== '', fn ($q) => $q->where('activo', (bool) $filtros['activo']))
            ->orderBy('nombre')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function obtenerTodos()
    {
        return Puesto::with('area')->orderBy('nombre')->get();
    }

    public function obtenerPorArea(int $areaId)
    {
        return Puesto::where('area_id', $areaId)->orderBy('nombre')->get();
    }

    public function crear(array $data): Puesto
    {
        $data['activo'] ??= true;

        return Puesto::create($data);
    }

    public function actualizar(Puesto $puesto, array $data): Puesto
    {
        $puesto->update($data);

        return $puesto;
    }

    public function eliminar(Puesto $puesto): void
    {
        if ($puesto->personaPuestos()->exists()) {
            throw ValidationException::withMessages([
                'puesto' => 'No se puede eliminar el puesto porque tiene personas asignadas. Puedes desactivarlo.',
            ]);
        }

        $puesto->delete();
    }

    public function toggleActivo(Puesto $puesto): Puesto
    {
        $puesto->update(['activo' => ! $puesto->activo]);

        return $puesto;
    }
}
