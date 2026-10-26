<?php

use App\Models\Configuracion;
use App\Services\BackupProgramacionService;
use Illuminate\Support\Carbon;

function programacionDiaria(): array
{
    return ['frecuencia' => 'diaria', 'hora' => '02:00', 'dia_semana' => 1, 'dia_mes' => 1];
}

function programacionSemanal(int $dia = 1): array
{
    return ['frecuencia' => 'semanal', 'hora' => '03:00', 'dia_semana' => $dia, 'dia_mes' => 1];
}

function programacionMensual(int $dia = 31): array
{
    return ['frecuencia' => 'mensual', 'hora' => '04:00', 'dia_semana' => 1, 'dia_mes' => $dia];
}

it('calcula la próxima ejecución diaria', function () {
    $servicio = new BackupProgramacionService();

    $proxima = $servicio->proximaEjecucion(Carbon::parse('2026-10-26 02:00:00'), programacionDiaria());

    expect($proxima->format('Y-m-d H:i'))->toBe('2026-10-27 02:00');
});

it('calcula la próxima ejecución semanal', function () {
    $servicio = new BackupProgramacionService();

    $desdeLunes = $servicio->proximaEjecucion(Carbon::parse('2026-10-26 03:00:00'), programacionSemanal(1));
    $desdeSemanaAnterior = $servicio->proximaEjecucion(Carbon::parse('2026-10-19 03:00:00'), programacionSemanal(1));

    expect($desdeLunes->format('Y-m-d H:i'))->toBe('2026-11-02 03:00')
        ->and($desdeSemanaAnterior->format('Y-m-d H:i'))->toBe('2026-10-26 03:00');
});

it('calcula la próxima ejecución mensual ajustando el día al último del mes', function () {
    $servicio = new BackupProgramacionService();

    $desdeEnero = $servicio->proximaEjecucion(Carbon::parse('2026-01-31 04:00:00'), programacionMensual(31));
    $desdeFebrero = $servicio->proximaEjecucion(Carbon::parse('2026-02-28 04:00:00'), programacionMensual(31));

    expect($desdeEnero->format('Y-m-d H:i'))->toBe('2026-02-28 04:00')
        ->and($desdeFebrero->format('Y-m-d H:i'))->toBe('2026-03-31 04:00');
});

it('no acumula ejecuciones atrasadas: solo una al volver', function () {
    $servicio = new BackupProgramacionService();

    Carbon::setTestNow('2026-10-29 10:00:00');

    $proxima = $servicio->proximaEjecucion(Carbon::parse('2026-10-25 02:00:00'), programacionDiaria());

    expect($proxima->format('Y-m-d H:i'))->toBe('2026-10-26 02:00')
        ->and(now()->greaterThanOrEqualTo($proxima))->toBeTrue();

    Carbon::setTestNow();
});

it('determina si la automatización debe ejecutarse', function () {
    Configuracion::create(['clave' => 'backup_auto_habilitado', 'valor' => '1']);
    Configuracion::create(['clave' => 'backup_frecuencia', 'valor' => 'diaria']);
    Configuracion::create(['clave' => 'backup_hora', 'valor' => '02:00']);
    Configuracion::create(['clave' => 'backup_ultima_ejecucion', 'valor' => '2026-10-25 02:00:00']);

    $servicio = app(BackupProgramacionService::class);

    Carbon::setTestNow('2026-10-26 01:00:00');
    expect($servicio->debeEjecutarse())->toBeFalse();

    Carbon::setTestNow('2026-10-26 02:30:00');
    expect($servicio->debeEjecutarse())->toBeTrue();

    Carbon::setTestNow('2026-10-26 02:30:00');
    expect(app(BackupProgramacionService::class)->configuracion()['proxima_ejecucion']->format('Y-m-d H:i'))
        ->toBe('2026-10-26 02:00');

    Carbon::setTestNow();
});

it('no debe ejecutarse sin línea base', function () {
    Configuracion::create(['clave' => 'backup_auto_habilitado', 'valor' => '1']);
    Configuracion::create(['clave' => 'backup_frecuencia', 'valor' => 'diaria']);
    Configuracion::create(['clave' => 'backup_hora', 'valor' => '02:00']);

    expect(app(BackupProgramacionService::class)->debeEjecutarse())->toBeFalse();
});
