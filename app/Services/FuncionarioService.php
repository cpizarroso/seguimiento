<?php

namespace App\Services;

use App\Models\Funcionario;
use App\Models\FuncionarioPuesto;
use App\Models\Puesto;
use App\Models\User;
use App\Models\UserPuesto;
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
            ->when($filtros['estado'] ?? null, fn ($q, $v) => $q->where('estado', $v))
            ->orderBy('nombre')
            ->paginate(min((int) ($filtros['per_page'] ?? 10), 100));
    }

    public function crear(array $data, ?User $user = null): Funcionario
    {
        $data['creado_por'] ??= $user?->id;
        $data['estado'] ??= 'activo';

        $funcionario = Funcionario::create($data);

        return $funcionario->load(['area', 'puesto']);
    }

    public function registrarPuestoInicial(Funcionario $funcionario): ?FuncionarioPuesto
    {
        return $this->abrirRegistroPuesto(
            $funcionario,
            $funcionario->creado_por,
            $funcionario->fecha_ingreso?->toDateString(),
        );
    }

    public function actualizar(Funcionario $funcionario, array $data, ?User $user = null): Funcionario
    {
        $puestoPrevio = $funcionario->puesto_id;

        $funcionario->update($data);

        $this->registrarCambioPuesto($funcionario, $puestoPrevio, $user?->id);

        $this->sincronizarUsuarioVinculado($funcionario->fresh(), $puestoPrevio);

        return $funcionario->fresh()->load(['area', 'puesto']);
    }

    public function cambiarPuesto(Funcionario $funcionario, int $puestoId, ?User $user = null): Funcionario
    {
        $puestoPrevio = $funcionario->puesto_id;

        $funcionario->update(['puesto_id' => $puestoId]);

        $this->registrarCambioPuesto($funcionario, $puestoPrevio, $user?->id);

        $this->sincronizarUsuarioVinculado($funcionario->fresh(), $puestoPrevio);

        return $funcionario->fresh()->load(['area', 'puesto']);
    }

    public function historialPuestos(Funcionario $funcionario)
    {
        return FuncionarioPuesto::with(['puesto', 'area', 'creadoPor'])
            ->where('funcionario_id', $funcionario->id)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->get();
    }

    public function eliminar(Funcionario $funcionario): void
    {
        $funcionario->delete();
    }

    private function sincronizarUsuarioVinculado(Funcionario $funcionario, int|string|null $puestoPrevio = null): void
    {
        $usuario = $funcionario->usuario;

        if (! $usuario) {
            return;
        }

        if ($funcionario->email && $usuario->email !== $funcionario->email) {
            $usuario->update(['email' => $funcionario->email]);
        }

        $puestoNuevo = $funcionario->puesto_id;

        if ((int) $puestoNuevo === (int) $puestoPrevio) {
            return;
        }

        $puestoActivo = $usuario->puestoActivo;

        if ($puestoActivo) {
            $puestoActivo->update(['fecha_fin' => now()->toDateString()]);
        }

        if ($puestoNuevo) {
            UserPuesto::create([
                'user_id' => $usuario->id,
                'puesto_id' => $puestoNuevo,
                'fecha_inicio' => now()->toDateString(),
            ]);
        }
    }

    private function registrarCambioPuesto(Funcionario $funcionario, int|string|null $puestoPrevio, ?int $usuarioId = null): void
    {
        if ((int) $funcionario->puesto_id === (int) $puestoPrevio) {
            return;
        }

        $this->cerrarRegistroVigente($funcionario->id);

        $this->abrirRegistroPuesto($funcionario, $usuarioId);
    }

    private function cerrarRegistroVigente(int $funcionarioId): void
    {
        FuncionarioPuesto::where('funcionario_id', $funcionarioId)
            ->whereNull('fecha_fin')
            ->orderByDesc('id')
            ->first()
            ?->update(['fecha_fin' => now()->toDateString()]);
    }

    private function abrirRegistroPuesto(Funcionario $funcionario, ?int $usuarioId = null, ?string $fechaInicio = null): ?FuncionarioPuesto
    {
        if (! $funcionario->puesto_id) {
            return null;
        }

        $areaId = Puesto::whereKey($funcionario->puesto_id)->value('area_id') ?? $funcionario->area_id;

        return FuncionarioPuesto::create([
            'funcionario_id' => $funcionario->id,
            'puesto_id' => $funcionario->puesto_id,
            'area_id' => $areaId,
            'fecha_inicio' => $fechaInicio ?? now()->toDateString(),
            'creado_por' => $usuarioId,
        ]);
    }

    public function obtenerPorId(int $id): Funcionario
    {
        return Funcionario::with(['area', 'puesto', 'creadoPor', 'usuario'])
            ->findOrFail($id);
    }

    public function obtenerTodos()
    {
        return Funcionario::with(['area', 'puesto'])->orderBy('nombre')->get();
    }
}
