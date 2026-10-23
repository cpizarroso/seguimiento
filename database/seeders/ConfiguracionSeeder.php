<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use App\Services\ConfiguracionService;
use Illuminate\Database\Seeder;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        Configuracion::updateOrCreate(
            ['clave' => ConfiguracionService::CLAVE_GESTION_INICIAL],
            ['valor' => (string) ConfiguracionService::GESTION_INICIAL_DEFAULT],
        );
    }
}
