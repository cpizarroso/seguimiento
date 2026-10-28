<?php

namespace App\Services;

use App\Backups\DiscosBackups;
use App\Models\Configuracion;
use Illuminate\Support\Carbon;

/**
 * Lee/escribe la configuración de automatización y calcula el vencimiento.
 *
 * Toda la configuración vive en la tabla `configuraciones` (clave/valor), por
 * lo que no requiere migraciones adicionales.
 */
class BackupProgramacionService
{
    public const CLAVE_AUTO = 'backup_auto_habilitado';

    public const CLAVE_FRECUENCIA = 'backup_frecuencia';

    public const CLAVE_HORA = 'backup_hora';

    public const CLAVE_DIA_SEMANA = 'backup_dia_semana';

    public const CLAVE_DIA_MES = 'backup_dia_mes';

    public const CLAVE_MAXIMO = 'backup_maximo';

    public const CLAVE_CUOTA_MB = 'backup_cuota_mb';

    public const CLAVE_ALERTA = 'backup_alerta_porcentaje';

    public const CLAVE_DESTINO = DiscosBackups::CLAVE_DESTINO;

    public const CLAVE_ULTIMA_EJECUCION = 'backup_ultima_ejecucion';

    public const CLAVE_HABILITADO_EN = 'backup_auto_habilitado_en';

    /**
     * @return list<string>
     */
    public function claves(): array
    {
        return [
            self::CLAVE_AUTO,
            self::CLAVE_FRECUENCIA,
            self::CLAVE_HORA,
            self::CLAVE_DIA_SEMANA,
            self::CLAVE_DIA_MES,
            self::CLAVE_MAXIMO,
            self::CLAVE_CUOTA_MB,
            self::CLAVE_ALERTA,
            self::CLAVE_DESTINO,
            self::CLAVE_ULTIMA_EJECUCION,
            self::CLAVE_HABILITADO_EN,
        ];
    }

    /**
     * @return array{
     *     habilitado: bool,
     *     frecuencia: string,
     *     hora: string,
     *     dia_semana: int,
     *     dia_mes: int,
     *     maximo: int,
     *     cuota_mb: int,
     *     alerta_porcentaje: int,
     *     destino: ?string,
     *     ultima_ejecucion: ?Carbon,
     *     habilitado_en: ?Carbon,
     *     proxima_ejecucion: ?Carbon
     * }
     */
    public function configuracion(): array
    {
        $guardado = Configuracion::whereIn('clave', $this->claves())->pluck('valor', 'clave');

        $frecuencia = (string) $this->valor($guardado, self::CLAVE_FRECUENCIA, 'diaria');
        $ultima = $this->fecha($this->valor($guardado, self::CLAVE_ULTIMA_EJECUCION, null));

        $config = [
            'habilitado' => $this->valor($guardado, self::CLAVE_AUTO, '0') === '1',
            'frecuencia' => in_array($frecuencia, ['diaria', 'semanal', 'mensual'], true) ? $frecuencia : 'diaria',
            'hora' => (string) $this->valor($guardado, self::CLAVE_HORA, '02:00'),
            'dia_semana' => min(7, max(1, (int) $this->valor($guardado, self::CLAVE_DIA_SEMANA, 1))),
            'dia_mes' => min(31, max(1, (int) $this->valor($guardado, self::CLAVE_DIA_MES, 1))),
            'maximo' => max(1, (int) $this->valor($guardado, self::CLAVE_MAXIMO, config('backups.maximo_default', 10))),
            'cuota_mb' => max(0, (int) $this->valor($guardado, self::CLAVE_CUOTA_MB, config('backups.cuota_mb_default', 0))),
            'alerta_porcentaje' => min(99, max(1, (int) $this->valor($guardado, self::CLAVE_ALERTA, config('backups.alerta_porcentaje_default', 85)))),
            'destino' => $this->textoOpcional($guardado, self::CLAVE_DESTINO),
            'ultima_ejecucion' => $ultima,
            'habilitado_en' => $this->fecha($this->valor($guardado, self::CLAVE_HABILITADO_EN, null)),
        ];

        $config['proxima_ejecucion'] = $config['habilitado'] && $ultima !== null
            ? $this->proximaEjecucion($ultima, $config)
            : null;

        return $config;
    }

    /**
     * @param  array{
     *     habilitado?: bool,
     *     frecuencia?: string,
     *     hora?: string,
     *     dia_semana?: int,
     *     dia_mes?: int,
     *     maximo?: int,
     *     cuota_mb?: int,
     *     alerta_porcentaje?: int,
     *     destino?: string|null
     * }  $datos
     */
    public function actualizar(array $datos): void
    {
        $anterior = $this->configuracion();

        $mapa = [
            'habilitado' => self::CLAVE_AUTO,
            'frecuencia' => self::CLAVE_FRECUENCIA,
            'hora' => self::CLAVE_HORA,
            'dia_semana' => self::CLAVE_DIA_SEMANA,
            'dia_mes' => self::CLAVE_DIA_MES,
            'maximo' => self::CLAVE_MAXIMO,
            'cuota_mb' => self::CLAVE_CUOTA_MB,
            'alerta_porcentaje' => self::CLAVE_ALERTA,
            'destino' => self::CLAVE_DESTINO,
        ];

        foreach ($mapa as $campo => $clave) {
            if (! array_key_exists($campo, $datos)) {
                continue;
            }

            $valor = $campo === 'habilitado'
                ? ((bool) $datos[$campo] ? '1' : '0')
                : (string) $datos[$campo];

            Configuracion::updateOrCreate(['clave' => $clave], ['valor' => $valor]);
        }

        if (($datos['habilitado'] ?? false) === true) {
            Configuracion::updateOrCreate(
                ['clave' => self::CLAVE_HABILITADO_EN],
                ['valor' => now()->format('Y-m-d H:i:s')],
            );

            // Línea base: el primer automático ocurre en el siguiente horario,
            // nunca de inmediato.
            if ($anterior['ultima_ejecucion'] === null) {
                $this->marcarEjecucion();
            }
        }
    }

    /**
     * Próxima ejecución posterior a $ultima según la frecuencia configurada.
     *
     * @param  array<string, mixed>|null  $config
     */
    public function proximaEjecucion(Carbon $ultima, ?array $config = null): Carbon
    {
        $config ??= $this->configuracion();

        [$hora, $minuto] = array_pad(explode(':', (string) $config['hora']), 2, '0');
        $hora = (int) $hora;
        $minuto = (int) $minuto;
        $zona = config('app.timezone');

        $ultima = $ultima->copy()->setTimezone($zona);

        $candidata = match ($config['frecuencia']) {
            'semanal' => $this->proximaSemanal($ultima, (int) $config['dia_semana'], $hora, $minuto),
            'mensual' => $this->proximaMensual($ultima, (int) $config['dia_mes'], $hora, $minuto),
            default => $this->proximaDiaria($ultima, $hora, $minuto),
        };

        return $candidata;
    }

    /**
     * @param  array<string, mixed>|null  $config
     */
    public function debeEjecutarse(?array $config = null): bool
    {
        $config ??= $this->configuracion();

        if (! $config['habilitado'] || $config['ultima_ejecucion'] === null) {
            return false;
        }

        return now()->gte($this->proximaEjecucion($config['ultima_ejecucion'], $config));
    }

    public function marcarEjecucion(?Carbon $momento = null): void
    {
        Configuracion::updateOrCreate(
            ['clave' => self::CLAVE_ULTIMA_EJECUCION],
            ['valor' => ($momento ?? now())->format('Y-m-d H:i:s')],
        );
    }

    private function proximaDiaria(Carbon $ultima, int $hora, int $minuto): Carbon
    {
        $candidata = $ultima->copy()->setTime($hora, $minuto, 0);

        if ($candidata->lessThanOrEqualTo($ultima)) {
            $candidata->addDay();
        }

        return $candidata;
    }

    private function proximaSemanal(Carbon $ultima, int $diaSemana, int $hora, int $minuto): Carbon
    {
        $candidata = $ultima->copy()->addDay()->setTime($hora, $minuto, 0);
        $delta = ($diaSemana - $candidata->isoWeekday() + 7) % 7;
        $candidata->addDays($delta);

        if ($candidata->lessThanOrEqualTo($ultima)) {
            $candidata->addWeek();
        }

        return $candidata;
    }

    private function proximaMensual(Carbon $ultima, int $diaMes, int $hora, int $minuto): Carbon
    {
        $candidata = $this->mesConDia($ultima->year, $ultima->month, $diaMes, $hora, $minuto);

        if ($candidata->lessThanOrEqualTo($ultima)) {
            $siguiente = $ultima->copy()->startOfMonth()->addMonth();
            $candidata = $this->mesConDia($siguiente->year, $siguiente->month, $diaMes, $hora, $minuto);
        }

        return $candidata;
    }

    private function mesConDia(int $year, int $month, int $diaMes, int $hora, int $minuto): Carbon
    {
        $zona = config('app.timezone');
        $ultimoDia = Carbon::create($year, $month, 1, 0, 0, 0, $zona)->daysInMonth;
        $dia = min($diaMes, $ultimoDia);

        return Carbon::create($year, $month, $dia, $hora, $minuto, 0, $zona);
    }

    private function valor(mixed $guardado, string $clave, mixed $default): ?string
    {
        $valor = $guardado[$clave] ?? null;

        return $valor === null || $valor === '' ? (string) $default : (string) $valor;
    }

    private function textoOpcional(mixed $guardado, string $clave): ?string
    {
        $valor = trim((string) ($guardado[$clave] ?? ''));

        return $valor === '' ? null : $valor;
    }

    private function fecha(?string $valor): ?Carbon
    {
        if ($valor === null || $valor === '') {
            return null;
        }

        try {
            return Carbon::parse($valor, config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }
    }
}
