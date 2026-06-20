<?php

namespace App\Services;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Pagination\LengthAwarePaginator;

class AreaService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Area::withCount('puestos')
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $palabras = preg_split('/\s+/', trim($v));
                foreach ($palabras as $palabra) {
                    $q->where(function ($q) use ($palabra) {
                        $q->where('nombre', 'like', "%{$palabra}%")
                            ->orWhere('sigla', 'like', "%{$palabra}%")
                            ->orWhere('descripcion', 'like', "%{$palabra}%");
                    });
                }
            }))
            ->orderBy('nombre')
            ->paginate(10);
    }

    public function crear(array $data, array $puestos = []): Area
    {
        $area = Area::create($data);

        foreach ($puestos as $puesto) {
            $area->puestos()->create($puesto);
        }

        return $area;
    }

    public function actualizar(Area $area, array $data, ?array $puestos = null): Area
    {
        $area->update($data);

        if ($puestos !== null) {
            $existingIds = $area->puestos()->pluck('id')->toArray();
            $submittedIds = array_values(array_filter(array_column($puestos, 'id')));

            $toDelete = array_diff($existingIds, $submittedIds);
            if ($toDelete) {
                $area->puestos()->whereIn('id', $toDelete)->delete();
            }

            foreach ($puestos as $puesto) {
                $puestoData = [
                    'nombre' => $puesto['nombre'],
                    'descripcion' => $puesto['descripcion'] ?? null,
                    'sigla' => $puesto['sigla'],
                    'estado' => $puesto['estado'] ?? true,
                ];

                if (isset($puesto['id'])) {
                    $area->puestos()->where('id', $puesto['id'])->update($puestoData);
                } else {
                    $area->puestos()->create($puestoData);
                }
            }
        }

        return $area;
    }

    public function eliminar(Area $area): void
    {
        $area->delete();
    }

    public function obtenerTodos()
    {
        return Area::orderBy('nombre')->get();
    }

    public function obtenerConPuestos(Area $area): Area
    {
        return $area->load(['puestos' => fn ($q) => $q->orderBy('nombre')]);
    }

    public function crearPuesto(Area $area, array $data): Puesto
    {
        return $area->puestos()->create($data);
    }

    public function actualizarPuesto(Puesto $puesto, array $data): Puesto
    {
        $puesto->update($data);

        return $puesto;
    }

    public function eliminarPuesto(Puesto $puesto): void
    {
        $puesto->delete();
    }
}
