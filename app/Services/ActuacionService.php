<?php

namespace App\Services;

use App\Models\Actuacion;
use App\Models\Tramite;

class ActuacionService
{
    public function crear(Tramite $tramite, array $data): Actuacion
    {
        $actuacion = Actuacion::create([
            'tramite_id' => $tramite->id,
            'area_id' => $data['area_id'],
            'funcionario_id' => $data['funcionario_id'],
            'glosa' => $data['glosa'],
            'fecha_actuacion' => now(),
        ]);

        return $actuacion->refresh()->load(['area', 'funcionario']);
    }

    public function eliminar(Actuacion $actuacion): void
    {
        $actuacion->delete();
    }
}
