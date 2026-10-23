<?php

namespace App\Services;

use App\Models\Configuracion;

class ConfiguracionService
{
    public const CLAVE_GESTION_INICIAL = 'reporte_gestion_inicial';

    public const GESTION_INICIAL_DEFAULT = 2023;

    public const GESTION_MINIMA = 2000;

    public function obtenerGestionInicial(): int
    {
        $valor = Configuracion::where('clave', self::CLAVE_GESTION_INICIAL)->value('valor');
        $gestion = is_numeric($valor) ? (int) $valor : self::GESTION_INICIAL_DEFAULT;

        return min(max($gestion, self::GESTION_MINIMA), (int) now()->year);
    }

    public function actualizarGestionInicial(int $gestion): void
    {
        Configuracion::updateOrCreate(
            ['clave' => self::CLAVE_GESTION_INICIAL],
            ['valor' => (string) $gestion],
        );
    }

    /**
     * Gestiones disponibles para filtrar reportes, de la más reciente a la más antigua.
     *
     * @return list<int>
     */
    public function gestionesDisponibles(): array
    {
        return range((int) now()->year, $this->obtenerGestionInicial());
    }

    /**
     * Gestiones que puede seleccionar el administrador como inicio del reporte.
     *
     * @return list<int>
     */
    public function gestionesConfigurables(): array
    {
        return range((int) now()->year, self::GESTION_MINIMA);
    }
}
