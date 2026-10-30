<?php

namespace App\Services;

use App\Models\Tramite;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TramiteService
{
    public function __construct(
        private readonly ContadorTramiteService $contadorService,
        private readonly DerivacionService $derivacionService,
    ) {}

    public function listar(array $filtros = [], ?int $usuarioId = null): LengthAwarePaginator
    {
        return $this->queryFiltrada($filtros)
            ->paginate(min((int) ($filtros['per_page'] ?? 15), 100));
    }

    public function coleccionParaExportar(array $filtros = []): Collection
    {
        return $this->queryFiltrada($filtros)->get();
    }

    private function queryFiltrada(array $filtros = []): Builder
    {
        $filtros = $this->normalizarRangoFechas($filtros);

        $query = Tramite::with([
            'creador.persona',
            'asignado.persona',
            'area',
            'derivaciones' => function ($q) {
                $q->with(['de.persona', 'a.persona.puestoActivo.puesto.area'])
                    ->reorder('numero_derivacion', 'desc')
                    ->limit(1);
            },
            'actuaciones' => function ($q) {
                $q->with(['area', 'persona'])->reorder('fecha_actuacion', 'desc')->limit(1);
            },
        ])
            ->select('tramites.*')
            ->leftJoin('areas', 'areas.id', '=', 'tramites.area_id')
            ->when($filtros['search'] ?? null, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('tramites.numero_completo', 'like', "%{$v}%")
                        ->orWhere('tramites.numero_tramite', 'like', "%{$v}%")
                        ->orWhere('tramites.descripcion', 'like', "%{$v}%")
                        ->orWhere('tramites.numero_diamante', 'like', "%{$v}%")
                        ->orWhere('tramites.estado', 'like', "%{$v}%")
                        ->orWhereHas('creador', fn ($q) => $this->buscarUsuario($q, $v))
                        ->orWhereHas('asignado', fn ($q) => $this->buscarUsuario($q, $v))
                        ->orWhereHas('area', fn ($q) => $q->where('nombre', 'like', "%{$v}%"));

                    if (str_contains($v, '/')) {
                        $parts = explode('/', $v);
                        $query->orWhere(function ($sub) use ($parts) {
                            foreach ($parts as $part) {
                                $part = trim($part);
                                if ($part === '') {
                                    continue;
                                }
                                $sub->where(function ($q2) use ($part) {
                                    $q2->where('numero_tramite', 'like', "%{$part}%")
                                        ->orWhere('year', 'like', "%{$part}%");
                                });
                            }
                        });
                    }
                });
            })
            ->when(filled($filtros['numero_tramite'] ?? null), function ($q) use ($filtros) {
                $v = trim((string) ($filtros['numero_tramite'] ?? ''));

                $q->where(function ($query) use ($v) {
                    $query->where('tramites.numero_tramite', 'like', "%{$v}%")
                        ->orWhere('tramites.numero_completo', 'like', "%{$v}%");

                    if (ctype_digit($v)) {
                        $sinCeros = ltrim($v, '0');

                        if ($sinCeros !== '' && $sinCeros !== $v) {
                            $query->orWhere('tramites.numero_tramite', 'like', "%{$sinCeros}%");
                        }
                    }
                });
            })
            ->when(filled($filtros['numero_diamante'] ?? null), function ($q) use ($filtros) {
                $v = trim((string) ($filtros['numero_diamante'] ?? ''));

                $q->where('tramites.numero_diamante', 'like', '%'.$v.'%');
            })
            ->when(filled($filtros['descripcion'] ?? null), function ($q) use ($filtros) {
                $v = trim((string) ($filtros['descripcion'] ?? ''));

                $q->where('tramites.descripcion', 'like', '%'.$v.'%');
            })
            ->when($filtros['estado'] ?? null, fn ($q, $v) => $q->where('tramites.estado', $v))
            ->when($filtros['area_id'] ?? null, fn ($q, $v) => $q->where('tramites.area_id', $v))
            ->when(in_array($filtros['recepcion'] ?? null, ['por_recepcionar', 'recepcionados'], true), function ($q) use ($filtros) {
                $estado = $filtros['recepcion'] === 'por_recepcionar' ? 'derivado' : 'recepcionado';

                $q->whereIn('tramites.id', function ($subquery) use ($estado) {
                    $subquery->select('d1.tramite_id')
                        ->from('derivaciones as d1')
                        ->where('d1.estado', $estado)
                        ->whereNotExists(function ($existente) {
                            $existente->select(DB::raw(1))
                                ->from('derivaciones as d2')
                                ->whereColumn('d2.tramite_id', 'd1.tramite_id')
                                ->whereColumn('d2.numero_derivacion', '>', 'd1.numero_derivacion');
                        });
                });
            })
            ->when(isset($filtros['urgente']) && $filtros['urgente'] !== null && $filtros['urgente'] !== '', function ($q) use ($filtros) {
                $q->where('tramites.urgente', filter_var($filtros['urgente'], FILTER_VALIDATE_BOOLEAN));
            })
            ->when(filled($filtros['fecha_desde'] ?? null), function ($q) use ($filtros) {
                $q->where('tramites.fecha', '>=', Carbon::parse($filtros['fecha_desde'])->startOfDay());
            })
            ->when(filled($filtros['fecha_hasta'] ?? null), function ($q) use ($filtros) {
                $q->where('tramites.fecha', '<', Carbon::parse($filtros['fecha_hasta'])->addDay()->startOfDay());
            })
            ->when(isset($filtros['hoy']) && $filtros['hoy'] !== null && $filtros['hoy'] !== '' && filter_var($filtros['hoy'], FILTER_VALIDATE_BOOLEAN), fn ($q) => $q->whereDate('tramites.fecha', today()));

        return $this->aplicarOrden($query, $filtros);
    }

    /**
     * Búsqueda por credenciales del usuario o por los datos de su persona.
     */
    private function buscarUsuario(Builder $query, string $termino): void
    {
        $query->where(function (Builder $sub) use ($termino) {
            $sub->where('users.username', 'like', "%{$termino}%")
                ->orWhere('users.email', 'like', "%{$termino}%")
                ->orWhereHas('persona', function (Builder $persona) use ($termino) {
                    $persona->where('nombres', 'like', "%{$termino}%")
                        ->orWhere('apellidos', 'like', "%{$termino}%")
                        ->orWhere('ci', 'like', "%{$termino}%");
                });
        });
    }

    /**
     * Si llega un rango invertido, lo devuelve en orden cronológico.
     *
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    private function normalizarRangoFechas(array $filtros): array
    {
        $desde = $filtros['fecha_desde'] ?? null;
        $hasta = $filtros['fecha_hasta'] ?? null;

        if ($desde && $hasta && $desde > $hasta) {
            $filtros['fecha_desde'] = $hasta;
            $filtros['fecha_hasta'] = $desde;
        }

        return $filtros;
    }

    /**
     * Aplica un orden seguro sobre columnas permitidas.
     *
     * @param  array<string, mixed>  $filtros
     */
    private function aplicarOrden(Builder $query, array $filtros): Builder
    {
        $sort = is_string($filtros['sort'] ?? null) ? $filtros['sort'] : null;
        $direction = strtolower((string) ($filtros['direction'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';

        $columnas = [
            'numero_tramite',
            'urgente',
            'created_at',
            'fecha',
            'numero_diamante',
            'area',
            'descripcion',
            'ultima_derivacion',
            'estado_derivacion',
            'dias_transcurridos',
            'estado',
        ];

        if (! in_array($sort, $columnas, true)) {
            return $query
                ->orderByDesc('tramites.created_at')
                ->orderBy('tramites.id');
        }

        if ($sort === 'area') {
            return $query
                ->orderBy('areas.codigo', $direction)
                ->orderBy('tramites.year', $direction)
                ->orderBy('tramites.numero_tramite', $direction);
        }

        if ($sort === 'numero_tramite') {
            return $query
                ->orderBy('tramites.numero_tramite', $direction)
                ->orderBy('tramites.year', $direction)
                ->orderBy('areas.codigo', $direction);
        }

        if ($sort === 'ultima_derivacion') {
            $ultimaDerivacion = DB::table('derivaciones')
                ->select('fecha_derivacion')
                ->whereColumn('derivaciones.tramite_id', 'tramites.id')
                ->orderByDesc('numero_derivacion')
                ->limit(1);

            return $query
                ->orderBy($ultimaDerivacion, $direction)
                ->orderBy('tramites.id');
        }

        if ($sort === 'estado_derivacion') {
            $estadoDerivacion = DB::table('derivaciones')
                ->select(DB::raw("CASE derivaciones.estado WHEN 'derivado' THEN 0 WHEN 'recepcionado' THEN 1 WHEN 'rechazado' THEN 2 ELSE 3 END"))
                ->whereColumn('derivaciones.tramite_id', 'tramites.id')
                ->orderByDesc('derivaciones.numero_derivacion')
                ->limit(1);

            return $query
                ->orderBy($estadoDerivacion, $direction)
                ->orderBy('tramites.id');
        }

        if ($sort === 'dias_transcurridos') {
            return $query
                ->orderByRaw($this->expresionDiasTranscurridos($direction))
                ->orderBy('tramites.id');
        }

        return $query
            ->orderBy("tramites.{$sort}", $direction)
            ->orderBy('tramites.id');
    }

    private function expresionDiasTranscurridos(string $direction): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "CAST(julianday(COALESCE(tramites.fecha_finalizacion, CURRENT_TIMESTAMP)) - julianday(COALESCE(tramites.created_at, tramites.fecha)) AS INTEGER) {$direction}";
        }

        return "DATEDIFF(COALESCE(tramites.fecha_finalizacion, NOW()), COALESCE(tramites.created_at, tramites.fecha)) {$direction}";
    }

    public function crear(array $data, int $creadoPor): Tramite
    {
        $areaId = (int) $data['area_id'];
        $fecha = filled($data['fecha'] ?? null)
            ? Carbon::createFromFormat('Y-m-d\TH:i', (string) $data['fecha'])
            : now();
        $year = (int) $fecha->year;
        $numero = $this->contadorService->siguienteNumero($areaId, $year);

        $tramite = Tramite::create([
            'numero_tramite' => $numero,
            'year' => $year,
            'fecha' => $fecha,
            'descripcion' => $data['descripcion'],
            'numero_diamante' => $data['numero_diamante'] ?? null,
            'estado' => 'iniciado',
            'urgente' => $data['urgente'] ?? false,
            'area_id' => $areaId,
            'creado_por' => $creadoPor,
            'derivado_a' => $creadoPor,
        ]);

        return $tramite->load(['creador.persona', 'asignado.persona', 'area']);
    }

    public function actualizar(Tramite $tramite, array $data): Tramite
    {
        $tramite->update([
            'descripcion' => $data['descripcion'],
            'numero_diamante' => $data['numero_diamante'] ?? null,
            'area_id' => $data['area_id'],
            'urgente' => $data['urgente'] ?? false,
        ]);

        return $tramite;
    }

    public function obtenerPorId(int $id): Tramite
    {
        return Tramite::with([
            'creador.persona',
            'asignado.persona',
            'area',
            'finalizadoPor.persona',
            'derivaciones' => fn ($q) => $q->with([
                'de.persona.puestoActivo.puesto.area',
                'a.persona.puestoActivo.puesto.area',
                'actuaciones' => fn ($qa) => $qa->with(['area', 'persona'])->orderBy('fecha_actuacion'),
            ])->orderBy('numero_derivacion'),
            'actuaciones' => fn ($q) => $q->with(['area', 'persona'])->orderBy('fecha_actuacion'),
        ])->findOrFail($id);
    }

    public function cambiarEstado(Tramite $tramite, string $estado, ?array $data = []): Tramite
    {
        if (! in_array($estado, Tramite::ESTADOS)) {
            throw new \InvalidArgumentException("Estado inválido: {$estado}");
        }

        $updateData = ['estado' => $estado];

        if ($estado === 'finalizado') {
            $updateData['glosa_finalizacion'] = $data['glosa_finalizacion'] ?? null;
            $updateData['fecha_finalizacion'] = now();
            $updateData['finalizado_por'] = auth()->id();
        }

        $tramite->update($updateData);

        return $tramite;
    }

    public function eliminar(Tramite $tramite): void
    {
        $tramite->delete();
    }
}
