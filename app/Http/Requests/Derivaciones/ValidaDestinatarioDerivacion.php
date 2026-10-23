<?php

namespace App\Http\Requests\Derivaciones;

use App\Models\User;
use Closure;

trait ValidaDestinatarioDerivacion
{
    /**
     * Valida que el destino no sea el usuario autenticado y que tenga
     * un puesto vigente en el área seleccionada.
     */
    protected function destinatarioEnArea(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if ($value === null || $value === '') {
                return;
            }

            $usuario = $this->user();
            $destinoId = (int) $value;

            if ($usuario && $destinoId === (int) $usuario->id) {
                $fail('No puedes derivarte a ti mismo.');

                return;
            }

            $areaId = $this->input('area_id');

            if ($areaId === null || $areaId === '') {
                $fail('Debes seleccionar un área.');

                return;
            }

            $pertenece = User::query()
                ->whereKey($destinoId)
                ->whereHas('persona.puestoActivo.puesto', function ($query) use ($areaId) {
                    $query->where('area_id', (int) $areaId)->where('activo', true);
                })
                ->exists();

            if (! $pertenece) {
                $fail('La persona seleccionada no pertenece al área indicada o no tiene usuario.');
            }
        };
    }
}
