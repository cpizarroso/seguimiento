<?php

use App\Models\Backup;
use App\Models\BackupEvento;
use App\Models\Configuracion;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

function configurarBackup(array $valores): void
{
    foreach ($valores as $clave => $valor) {
        Configuracion::updateOrCreate(['clave' => $clave], ['valor' => (string) $valor]);
    }
}

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();
});

afterEach(function () {
    Carbon::setTestNow();
});

it('marca como fallidos los backups en proceso interrumpidos', function () {
    $backup = Backup::create([
        'nombre' => 'backup-colgado.sql.gz',
        'ruta' => 'backup-colgado.sql.gz',
        'disco' => 'backups',
        'tipo' => Backup::TIPO_AUTOMATICO,
        'estado' => Backup::ESTADO_EN_PROCESO,
        'protegido' => false,
    ]);

    DB::table('backups')->where('id', $backup->id)->update([
        'updated_at' => now()->subHours(2),
    ]);

    $this->artisan('backups:recuperar')->assertSuccessful();

    expect($backup->fresh()->estado)->toBe(Backup::ESTADO_FALLIDO)
        ->and($backup->fresh()->error)->toContain('interrumpida')
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_FALLO)->count())->toBe(1);
});

it('elimina archivos huérfanos con la opción limpiar', function () {
    Storage::disk('backups')->put('huerfano.sql.gz', 'x');

    $this->artisan('backups:recuperar', ['--limpiar' => true])->assertSuccessful();

    expect(Storage::disk('backups')->exists('huerfano.sql.gz'))->toBeFalse();
});

it('no ejecuta el automático sin línea base y la fija', function () {
    configurarBackup([
        'backup_auto_habilitado' => '1',
        'backup_frecuencia' => 'diaria',
        'backup_hora' => '02:00',
    ]);

    Carbon::setTestNow('2026-10-26 10:00:00');

    $this->artisan('backups:auto')->assertSuccessful();

    expect(Backup::count())->toBe(0)
        ->and(Configuracion::where('clave', 'backup_ultima_ejecucion')->value('valor'))
        ->toBe('2026-10-26 10:00:00');
});

it('ejecuta el backup automático cuando está vencido', function () {
    configurarBackup([
        'backup_auto_habilitado' => '1',
        'backup_frecuencia' => 'diaria',
        'backup_hora' => '02:00',
        'backup_ultima_ejecucion' => '2026-10-25 02:00:00',
    ]);

    Carbon::setTestNow('2026-10-26 10:00:00');

    $this->artisan('backups:auto')->assertSuccessful();

    $backup = Backup::first();

    expect($backup)->not->toBeNull()
        ->and($backup->tipo)->toBe(Backup::TIPO_AUTOMATICO)
        ->and($backup->user_id)->toBeNull()
        ->and($backup->estado)->toBe(Backup::ESTADO_COMPLETADO)
        ->and(Configuracion::where('clave', 'backup_ultima_ejecucion')->value('valor'))
        ->toBe('2026-10-26 10:00:00');
});

it('no ejecuta el automático si todavía no vence', function () {
    configurarBackup([
        'backup_auto_habilitado' => '1',
        'backup_frecuencia' => 'diaria',
        'backup_hora' => '02:00',
        'backup_ultima_ejecucion' => '2026-10-26 02:00:00',
    ]);

    Carbon::setTestNow('2026-10-26 10:00:00');

    $this->artisan('backups:auto')->assertSuccessful();

    expect(Backup::count())->toBe(0)
        ->and(Configuracion::where('clave', 'backup_ultima_ejecucion')->value('valor'))
        ->toBe('2026-10-26 02:00:00');
});

it('no ejecuta el automático si está deshabilitado', function () {
    configurarBackup([
        'backup_auto_habilitado' => '0',
        'backup_frecuencia' => 'diaria',
        'backup_hora' => '02:00',
        'backup_ultima_ejecucion' => '2026-10-01 02:00:00',
    ]);

    Carbon::setTestNow('2026-10-26 10:00:00');

    $this->artisan('backups:auto')->assertSuccessful();

    expect(Backup::count())->toBe(0);
});
