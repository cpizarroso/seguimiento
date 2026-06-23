<?php

namespace App\Services;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AreaService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Area::with(['parent'])
            ->withCount('puestos')
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
            ->paginate((int) ($filtros['per_page'] ?? 10));
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
        return Area::with('parent')->orderBy('nombre')->get();
    }

    public function obtenerRaices()
    {
        return Area::whereNull('parent_id')->with('children')->orderBy('nombre')->get();
    }

    public function obtenerArbolCompleto(): array
    {
        $areas = Area::with('puestos')->orderBy('nombre')->get();

        return $this->buildTree($areas);
    }

    private function buildTree(Collection $areas, ?int $parentId = null): array
    {
        return $areas->filter(fn (Area $a) => $a->parent_id === $parentId)
            ->values()
            ->map(fn (Area $a) => [
                'id' => $a->id,
                'nombre' => $a->nombre,
                'sigla' => $a->sigla,
                'descripcion' => $a->descripcion,
                'estado' => $a->estado,
                'parent_id' => $a->parent_id,
                'puestos_count' => $a->puestos->count(),
                'puestos' => $a->puestos->map(fn (Puesto $p) => [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'descripcion' => $p->descripcion,
                    'sigla' => $p->sigla,
                    'estado' => $p->estado,
                    'area_id' => $p->area_id,
                ])->values()->toArray(),
                'children' => $this->buildTree($areas, $a->id),
            ])
            ->toArray();
    }

    public function obtenerConPuestos(Area $area): Area
    {
        return $area->load([
            'parent',
            'children' => fn ($q) => $q->orderBy('nombre'),
            'puestos' => fn ($q) => $q->orderBy('nombre'),
        ]);
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
