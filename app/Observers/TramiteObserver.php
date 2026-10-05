<?php

namespace App\Observers;

use App\Models\Tramite;

class TramiteObserver
{
    public function created(Tramite $tramite): void
    {
        $tramite->crearPrimeraDerivacion();
    }
}
