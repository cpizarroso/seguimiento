<?php

namespace App\Services;

use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PersonaService
{
    public function listar(array $filtros = []): LengthAwarePaginator
    {
        return Persona::with(['puestoActivo.puesto.area', 'user', 'historialPuestos.puesto.area'])
            ->when($filtros['search'] ?? null, fn ($q, $v) => $q->where(function ($q) use ($v) {
                foreach (preg_split('/\s+/', trim($v)) as $palabra) {
                    $q->where(function ($q) use ($palabra) {
                        $q->where('nombres', 'like', "%{$palabra}%")
                            ->orWhere('apellidos', 'like', "%{$palabra}%")
                            ->orWhere('ci', 'like', "%{$palabra}%")
                            ->orWhere('correo', 'like', "%{$palabra}%");
                    });
                }
            }))
            ->when($filtros['area_id'] ?? null, fn ($q, $v) => $q->whereHas(
                'puestoActivo.puesto',
                fn ($q) => $q->where('area_id', $v)
            ))
            ->when($filtros['puesto_id'] ?? null, fn ($q, $v) => $q->whereHas(
                'puestoActivo',
                fn ($q) => $q->where('puesto_id', $v)
            ))
            ->when(isset($filtros['activo']) && $filtros['activo'] !== '', fn ($q) => $q->where('activo', (bool) $filtros['activo']))
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data, ?User $usuario = null): Persona
    {
        $puestoId = $data['puesto_id'] ?? null;
        $fechaInicio = $data['fecha_inicio'] ?? now()->toDateString();
        unset($data['puesto_id'], $data['fecha_inicio']);

        $persona = DB::transaction(function () use ($data, $puestoId, $fechaInicio) {
            $persona = Persona::create($data);

            if ($puestoId) {
                $this->abrirRegistro($persona, (int) $puestoId, $fechaInicio);
            }

            return $persona;
        });

        return $persona->load(['puestoActivo.puesto.area', 'user']);
    }

    public function actualizar(Persona $persona, array $data, ?User $usuario = null): Persona
    {
        $puestoId = $data['puesto_id'] ?? null;
        $fechaInicio = $data['fecha_inicio'] ?? now()->toDateString();
        unset($data['puesto_id'], $data['fecha_inicio']);

        if (array_key_exists('activo', $data) && $data['activo'] === null) {
            unset($data['activo']);
        }

        DB::transaction(function () use ($persona, $data, $puestoId, $fechaInicio) {
            $persona->update($data);

            $puestoActual = $persona->puestoActivo()->value('puesto_id');

            if ($puestoId && (int) $puestoId !== (int) $puestoActual) {
                $this->asignarPuestoInterno($persona, (int) $puestoId, $fechaInicio);
            }

            $this->sincronizarUsuarioVinculado($persona->fresh());
        });

        return $persona->fresh()->load(['puestoActivo.puesto.area', 'user', 'historialPuestos.puesto.area']);
    }

    public function cambiarPuesto(Persona $persona, int $puestoId, ?string $fechaInicio = null): Persona
    {
        DB::transaction(function () use ($persona, $puestoId, $fechaInicio) {
            $this->asignarPuestoInterno($persona, $puestoId, $fechaInicio ?? now()->toDateString());
            $this->sincronizarUsuarioVinculado($persona->fresh());
        });

        return $persona->fresh()->load(['puestoActivo.puesto.area', 'user', 'historialPuestos.puesto.area']);
    }

    public function historialPuestos(Persona $persona)
    {
        return PersonaPuesto::with(['puesto.area'])
            ->where('persona_id', $persona->id)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get();
    }

    public function eliminar(Persona $persona): void
    {
        if ($persona->user()->exists()) {
            throw ValidationException::withMessages([
                'persona' => 'No se puede eliminar la persona porque tiene un usuario vinculado.',
            ]);
        }

        if ($persona->historialPuestos()->exists()) {
            throw ValidationException::withMessages([
                'persona' => 'No se puede eliminar la persona porque tiene historial de puestos. Puedes desactivarla.',
            ]);
        }

        $persona->delete();
    }

    public function toggleActivo(Persona $persona): Persona
    {
        $persona->update(['activo' => ! $persona->activo]);

        return $persona;
    }

    public function obtenerPorId(int $id): Persona
    {
        return Persona::with(['puestoActivo.puesto.area', 'user', 'historialPuestos.puesto.area'])
            ->findOrFail($id);
    }

    public function obtenerTodos()
    {
        return Persona::with(['puestoActivo.puesto.area', 'user'])
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();
    }

    private function asignarPuestoInterno(Persona $persona, int $puestoId, string $fechaInicio): void
    {
        $this->cerrarRegistroVigente($persona->id);
        $this->abrirRegistro($persona, $puestoId, $fechaInicio);
    }

    private function cerrarRegistroVigente(int $personaId): void
    {
        PersonaPuesto::where('persona_id', $personaId)
            ->whereNull('fecha_fin')
            ->update(['fecha_fin' => now()->toDateString()]);
    }

    private function abrirRegistro(Persona $persona, int $puestoId, string $fechaInicio): PersonaPuesto
    {
        $puesto = Puesto::with('area')->findOrFail($puestoId);

        if (! $puesto->activo) {
            throw ValidationException::withMessages([
                'puesto_id' => 'El puesto seleccionado está inactivo.',
            ]);
        }

        if (! $puesto->area?->activo) {
            throw ValidationException::withMessages([
                'puesto_id' => 'El área del puesto seleccionado está inactiva.',
            ]);
        }

        return PersonaPuesto::create([
            'persona_id' => $persona->id,
            'puesto_id' => $puesto->id,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => null,
        ]);
    }

    private function sincronizarUsuarioVinculado(Persona $persona): void
    {
        $usuario = $persona->user;

        if (! $usuario) {
            return;
        }

        $cambios = [];

        if ($persona->correo && $usuario->email !== $persona->correo) {
            $cambios['email'] = $persona->correo;
        }

        $nombreCompleto = $persona->nombre_completo;

        if ($nombreCompleto && $usuario->name !== $nombreCompleto) {
            $cambios['name'] = $nombreCompleto;
        }

        if ($cambios !== []) {
            $usuario->update($cambios);
        }
    }
}
