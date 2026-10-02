<?php

namespace App\Observers;

use App\Models\Funcionario;
use App\Services\FuncionarioService;

class FuncionarioObserver
{
    public function __construct(private readonly FuncionarioService $funcionarioService) {}

    public function created(Funcionario $funcionario): void
    {
        if (! $funcionario->puesto_id) {
            return;
        }

        if ($funcionario->historialPuestos()->whereNull('fecha_fin')->exists()) {
            return;
        }

        $this->funcionarioService->registrarPuestoInicial($funcionario);
    }
}
