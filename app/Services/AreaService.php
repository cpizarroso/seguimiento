<?php

namespace App\Services;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AreaService
{
    /**
     * Puestos estándar que se crean junto con un área.
     *
     * @var array<string, array{nombre: string, sufijo: string, descripcion: string}>
     */
    public const PUESTOS_ESTANDAR = [
        'JEFE' => ['nombre' => 'JEFE', 'sufijo' => 'JEF', 'descripcion' => 'Máxima autoridad del área.'],
        'PROFESIONAL' => ['nombre' => 'PROFESIONAL', 'sufijo' => 'PRO', 'descripcion' => 'Personal profesional del área.'],
        'SECRETARIA' => ['nombre' => 'SECRETARIA', 'sufijo' => 'SEC', 'descripcion' => 'Apoyo secretarial del área.'],
        'ASISTENTE' => ['nombre' => 'ASISTENTE', 'sufijo' => 'ASI', 'descripcion' => 'Apoyo administrativo del área.'],
    ];

    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Area::with('parent')
            ->withCount(['puestos', 'children'])
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                foreach (preg_split('/\s+/', trim($v)) as $palabra) {
                    $q->where(function ($q) use ($palabra) {
                        $q->where('nombre', 'like', "%{$palabra}%")
                            ->orWhere('codigo', 'like', "%{$palabra}%")
                            ->orWhere('descripcion', 'like', "%{$palabra}%");
                    });
                }
            }))
            ->orderBy('nombre')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data, array $puestosEstandar = []): Area
    {
        $data['activo'] ??= true;

        return DB::transaction(function () use ($data, $puestosEstandar) {
            $area = Area::create($data);

            foreach ($puestosEstandar as $clave) {
                if (isset(self::PUESTOS_ESTANDAR[$clave])) {
                    $this->crearPuesto($area, self::PUESTOS_ESTANDAR[$clave]);
                }
            }

            return $area->load('puestos');
        });
    }

    public function actualizar(Area $area, array $data): Area
    {
        if (array_key_exists('activo', $data) && $data['activo'] === null) {
            unset($data['activo']);
        }

        if (isset($data['area_padre_id']) && $data['area_padre_id'] !== null) {
            $this->validarJerarquia($area, (int) $data['area_padre_id']);
        }

        $area->update($data);

        return $area->fresh()->load('puestos');
    }

    public function eliminar(Area $area): void
    {
        if ($area->children()->exists()) {
            throw ValidationException::withMessages([
                'area' => 'No se puede eliminar el área porque tiene subáreas.',
            ]);
        }

        if ($area->puestos()->exists()) {
            throw ValidationException::withMessages([
                'area' => 'No se puede eliminar el área porque tiene puestos. Elimina o desactiva sus puestos primero.',
            ]);
        }

        if ($area->tramites()->exists()) {
            throw ValidationException::withMessages([
                'area' => 'No se puede eliminar el área porque tiene trámites asociados.',
            ]);
        }

        $area->delete();
    }

    public function toggleActivo(Area $area): Area
    {
        $area->update(['activo' => ! $area->activo]);

        return $area;
    }

    public function obtenerTodos()
    {
        return Area::with('parent')->orderBy('nombre')->get();
    }

    public function obtenerRaices()
    {
        return Area::whereNull('area_padre_id')->with('children')->orderBy('nombre')->get();
    }

    public function obtenerArbolCompleto(): array
    {
        $areas = Area::with(['puestos', 'responsable'])
            ->orderBy('nombre')
            ->get();

        $personasPorArea = $this->contarPersonasPorArea();
        $usuariosPorArea = $this->contarUsuariosPorArea();
        $personasPorPuesto = $this->contarPersonasPorPuesto();
        $usuariosPorPuesto = $this->contarUsuariosPorPuesto();

        return $this->buildTree(
            $areas,
            null,
            $personasPorArea,
            $usuariosPorArea,
            $personasPorPuesto,
            $usuariosPorPuesto,
        );
    }

    /**
     * Árbol aplanado para selectores de área padre.
     *
     * @return array<int, array{id: int, nombre: string, codigo: string, path: string, depth: int, activo: bool, disabled: bool}>
     */
    public function obtenerOpciones(?int $excluirAreaId = null): array
    {
        $areas = Area::orderBy('nombre')->get();

        $excluidos = [];

        if ($excluirAreaId) {
            $excluidos = $this->obtenerIdsDescendientes($areas, $excluirAreaId);
            $excluidos[] = $excluirAreaId;
        }

        $opciones = [];

        $recorrer = function (?int $parentId, string $prefijo, int $depth) use (&$recorrer, &$opciones, $areas, $excluidos) {
            foreach ($areas->where('area_padre_id', $parentId) as $area) {
                if (in_array($area->id, $excluidos, true)) {
                    continue;
                }

                $path = $prefijo === '' ? $area->nombre : "{$prefijo} / {$area->nombre}";

                $opciones[] = [
                    'id' => $area->id,
                    'nombre' => $area->nombre,
                    'codigo' => $area->codigo,
                    'path' => $path,
                    'depth' => $depth,
                    'activo' => $area->activo,
                    'disabled' => ! $area->activo,
                ];

                $recorrer($area->id, $path, $depth + 1);
            }
        };

        $recorrer(null, '', 0);

        return $opciones;
    }

    public function obtenerConPuestos(Area $area): Area
    {
        return $area->load([
            'parent',
            'children' => fn ($q) => $q->orderBy('nombre'),
            'puestos' => fn ($q) => $q->orderBy('nombre')->withCount(['personaPuestos as personas_count' => fn ($q) => $q->whereNull('fecha_fin')]),
        ]);
    }

    public function crearPuesto(Area $area, array $data): Puesto
    {
        $data['activo'] ??= true;
        $data['codigo'] = $data['codigo'] ?? $this->generarCodigoPuesto($area, $data['nombre']);

        return $area->puestos()->create($data);
    }

    public function actualizarPuesto(Puesto $puesto, array $data): Puesto
    {
        if (array_key_exists('activo', $data) && $data['activo'] === null) {
            unset($data['activo']);
        }

        $puesto->update($data);

        return $puesto;
    }

    public function eliminarPuesto(Puesto $puesto): void
    {
        if ($puesto->personaPuestos()->exists()) {
            throw ValidationException::withMessages([
                'puesto' => 'No se puede eliminar el puesto porque tiene personas asignadas. Puedes desactivarlo.',
            ]);
        }

        $puesto->delete();
    }

    public function togglePuesto(Puesto $puesto): Puesto
    {
        $puesto->update(['activo' => ! $puesto->activo]);

        return $puesto;
    }

    public function validarJerarquia(Area $area, int $areaPadreId): void
    {
        if ($areaPadreId === $area->id) {
            throw ValidationException::withMessages([
                'area_padre_id' => 'El área no puede ser su propia área padre.',
            ]);
        }

        $padre = Area::find($areaPadreId);

        if (! $padre) {
            throw ValidationException::withMessages([
                'area_padre_id' => 'El área padre seleccionada no existe.',
            ]);
        }

        $actual = $padre;

        while ($actual) {
            if ($actual->id === $area->id) {
                throw ValidationException::withMessages([
                    'area_padre_id' => 'El área padre no puede ser una subárea del área que estás editando.',
                ]);
            }

            $actual = $actual->parent;
        }
    }

    public function generarCodigoPuesto(Area $area, string $nombre): string
    {
        $nombreNormalizado = Str::upper(trim($nombre));

        $estandar = collect(self::PUESTOS_ESTANDAR)
            ->first(fn ($puesto) => Str::upper($puesto['nombre']) === $nombreNormalizado);

        $sufijo = $estandar['sufijo']
            ?? Str::upper(Str::substr(Str::slug($nombre, ''), 0, 8));

        $base = "{$area->codigo}-{$sufijo}";
        $codigo = $base;
        $contador = 2;

        while (Puesto::where('codigo', $codigo)->exists()) {
            $codigo = "{$base}-{$contador}";
            $contador++;
        }

        return $codigo;
    }

    private function buildTree(
        Collection $areas,
        ?int $parentId,
        Collection $personasPorArea,
        Collection $usuariosPorArea,
        Collection $personasPorPuesto,
        Collection $usuariosPorPuesto,
    ): array {
        return $areas->filter(fn (Area $a) => $a->area_padre_id === $parentId)
            ->values()
            ->map(fn (Area $a) => [
                'id' => $a->id,
                'nombre' => $a->nombre,
                'codigo' => $a->codigo,
                'descripcion' => $a->descripcion,
                'activo' => $a->activo,
                'area_padre_id' => $a->area_padre_id,
                'user_id' => $a->user_id,
                'responsable' => $a->responsable ? [
                    'id' => $a->responsable->id,
                    'name' => $a->responsable->nombre_completo,
                    'email' => $a->responsable->email,
                ] : null,
                'puestos_count' => $a->puestos->count(),
                'personas_count' => (int) ($personasPorArea[$a->id] ?? 0),
                'usuarios_count' => (int) ($usuariosPorArea[$a->id] ?? 0),
                'puestos' => $a->puestos->map(fn (Puesto $p) => [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'descripcion' => $p->descripcion,
                    'codigo' => $p->codigo,
                    'activo' => $p->activo,
                    'area_id' => $p->area_id,
                    'personas_count' => (int) ($personasPorPuesto[$p->id] ?? 0),
                    'usuarios_count' => (int) ($usuariosPorPuesto[$p->id] ?? 0),
                ])->values()->toArray(),
                'children' => $this->buildTree(
                    $areas,
                    $a->id,
                    $personasPorArea,
                    $usuariosPorArea,
                    $personasPorPuesto,
                    $usuariosPorPuesto,
                ),
            ])
            ->toArray();
    }

    private function contarPersonasPorArea(): Collection
    {
        return DB::table('persona_puesto as pp')
            ->join('puestos as p', 'p.id', '=', 'pp.puesto_id')
            ->join('personas as pe', 'pe.id', '=', 'pp.persona_id')
            ->whereNull('pp.fecha_fin')
            ->where('pe.activo', true)
            ->where('p.activo', true)
            ->groupBy('p.area_id')
            ->select('p.area_id', DB::raw('count(distinct pp.persona_id) as total'))
            ->pluck('total', 'p.area_id');
    }

    private function contarUsuariosPorArea(): Collection
    {
        return DB::table('persona_puesto as pp')
            ->join('puestos as p', 'p.id', '=', 'pp.puesto_id')
            ->join('personas as pe', 'pe.id', '=', 'pp.persona_id')
            ->join('users as u', 'u.persona_id', '=', 'pe.id')
            ->whereNull('pp.fecha_fin')
            ->where('pe.activo', true)
            ->where('p.activo', true)
            ->groupBy('p.area_id')
            ->select('p.area_id', DB::raw('count(distinct u.id) as total'))
            ->pluck('total', 'p.area_id');
    }

    private function contarPersonasPorPuesto(): Collection
    {
        return DB::table('persona_puesto as pp')
            ->join('personas as pe', 'pe.id', '=', 'pp.persona_id')
            ->join('puestos as p', 'p.id', '=', 'pp.puesto_id')
            ->whereNull('pp.fecha_fin')
            ->where('pe.activo', true)
            ->where('p.activo', true)
            ->groupBy('pp.puesto_id')
            ->select('pp.puesto_id', DB::raw('count(distinct pp.persona_id) as total'))
            ->pluck('total', 'pp.puesto_id');
    }

    private function contarUsuariosPorPuesto(): Collection
    {
        return DB::table('persona_puesto as pp')
            ->join('personas as pe', 'pe.id', '=', 'pp.persona_id')
            ->join('users as u', 'u.persona_id', '=', 'pe.id')
            ->join('puestos as p', 'p.id', '=', 'pp.puesto_id')
            ->whereNull('pp.fecha_fin')
            ->where('pe.activo', true)
            ->where('p.activo', true)
            ->groupBy('pp.puesto_id')
            ->select('pp.puesto_id', DB::raw('count(distinct u.id) as total'))
            ->pluck('total', 'pp.puesto_id');
    }

    private function obtenerIdsDescendientes(Collection $areas, int $areaId): array
    {
        $ids = [];
        $pendientes = [$areaId];

        while ($pendientes !== []) {
            $actual = array_shift($pendientes);
            foreach ($areas->where('area_padre_id', $actual) as $hijo) {
                $ids[] = $hijo->id;
                $pendientes[] = $hijo->id;
            }
        }

        return $ids;
    }
}
