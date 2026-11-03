<?php

namespace App\Support;

use Carbon\Carbon;

/**
 * Normaliza fechas de planillas Excel con errores de tipeo.
 */
final class NormalizadorFechaExcel
{
    public const ANIO_GESTION = 2026;

    public static function desdeCelda(mixed $valor): ?Carbon
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        if (is_numeric($valor)) {
            return self::desdeSerial((float) $valor);
        }

        return self::desdeTexto((string) $valor);
    }

    /**
     * Serial de Excel (base 1899-12-30). Descarta los seriales corruptos.
     */
    private static function desdeSerial(float $serial): ?Carbon
    {
        if ($serial < 1) {
            return null;
        }

        $fecha = Carbon::create(1899, 12, 30)
            ->addDays((int) round($serial))
            ->startOfDay();

        return $fecha->year === self::ANIO_GESTION ? $fecha : null;
    }

    /**
     * Interpreta fechas escritas a mano: dd/mm/aaaa con separadores
     * duplicados, faltantes o años mal tipeados (206, 25026, 1026...).
     */
    public static function desdeTexto(?string $texto): ?Carbon
    {
        $texto = trim((string) $texto);

        if ($texto === '') {
            return null;
        }

        preg_match_all('/\d+/', $texto, $coincidencias);

        $grupos = array_values(array_filter(
            $coincidencias[0],
            fn (string $grupo) => $grupo !== '',
        ));

        if (count($grupos) < 2) {
            return null;
        }

        // El año se descarta: toda la planilla es de la gestión 2026 y sus
        // variantes (206, 25026, 1026...) son errores de tipeo.
        $grupos = self::quitarAnio($grupos);

        return self::primerCandidato($grupos);
    }

    /**
     * Quita el año del final, conservando los dígitos que lo acompañan
     * cuando vienen pegados al mes (ej. "28/082026").
     *
     * @param  list<string>  $grupos
     * @return list<string>
     */
    private static function quitarAnio(array $grupos): array
    {
        $ultimo = end($grupos);

        if ($ultimo === false || strlen($ultimo) < 3) {
            return $grupos;
        }

        array_pop($grupos);

        $resto = strlen($ultimo) > 4 ? substr($ultimo, 0, -4) : '';

        // "25026", "20226", "20269": dígito sobrante pegado al año.
        if (strlen($ultimo) === 5 && str_starts_with($ultimo, '2')) {
            $resto = '';
        }

        while ($resto !== '' && $resto[0] === '0') {
            $resto = substr($resto, 1);
        }

        if ($resto !== '') {
            $grupos[] = $resto;
        }

        return $grupos;
    }

    /**
     * Busca una fecha dentro de un texto libre ("... EL 28/05/2026").
     */
    public static function fechaEnTexto(?string $texto): ?Carbon
    {
        $texto = preg_replace('#([/\-.]){2,}#', '$1', (string) $texto) ?? '';

        if (preg_match('#\d{1,3}\s*[\/\-\.]\s*\d{1,3}\s*[\/\-\.]\s*\d{2,5}#', $texto, $coincidencia)) {
            return self::desdeCelda($coincidencia[0]);
        }

        // "2209/2026" (día y mes pegados).
        if (preg_match('#\b\d{4}[\/\-\.]\d{4}\b#', $texto, $coincidencia)) {
            return self::desdeCelda($coincidencia[0]);
        }

        return null;
    }

    /**
     * @param  list<string>  $grupos
     */
    private static function primerCandidato(array $grupos): ?Carbon
    {
        if (count($grupos) === 2) {
            $directo = self::armar((int) $grupos[0], (int) $grupos[1]);

            if ($directo !== null) {
                return $directo;
            }
        }

        foreach (self::candidatos($grupos) as $fecha) {
            return $fecha;
        }

        return null;
    }

    /**
     * Candidatos día/mes válidos a partir de un texto libre.
     *
     * @return list<Carbon>
     */
    public static function candidatosDesdeTexto(?string $texto): array
    {
        preg_match_all('/\d+/', (string) $texto, $coincidencias);

        $grupos = array_values(array_filter(
            $coincidencias[0],
            fn (string $grupo) => $grupo !== '',
        ));

        if ($grupos === []) {
            return [];
        }

        return self::candidatos(self::quitarAnio($grupos));
    }

    /**
     * Candidatos día/mes válidos a partir de los grupos de dígitos.
     *
     * @param  list<string>  $grupos
     * @return list<Carbon>
     */
    public static function candidatos(array $grupos): array
    {
        $digitos = implode('', $grupos);

        if ($digitos === '') {
            return [];
        }

        $candidatos = [];

        for ($corte = 1; $corte < strlen($digitos); $corte++) {
            $dia = (int) substr($digitos, 0, $corte);
            $mes = (int) substr($digitos, $corte);

            $fecha = self::armar($dia, $mes);

            if ($fecha !== null) {
                $candidatos[] = $fecha;
            }
        }

        return $candidatos;
    }

    private static function armar(int $dia, int $mes): ?Carbon
    {
        if ($dia < 1 || $dia > 31 || $mes < 1 || $mes > 12) {
            return null;
        }

        if (! checkdate($mes, $dia, self::ANIO_GESTION)) {
            return null;
        }

        return Carbon::create(self::ANIO_GESTION, $mes, $dia)->startOfDay();
    }
}
