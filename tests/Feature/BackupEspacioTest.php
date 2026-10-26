<?php

use App\Models\Backup;
use App\Models\Configuracion;
use App\Services\BackupEspacioService;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();
});

it('expone el estado del almacenamiento', function () {
    $admin = crearAdminBackups();
    crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    Storage::disk('backups')->put('huerfano.sql.gz', 'sin registrar');

    $this->actingAs($admin)
        ->getJson(route('backups.espacio'))
        ->assertOk()
        ->assertJsonPath('backups.cantidad', 1)
        ->assertJsonPath('backups.huerfanos', 1)
        ->assertJsonStructure([
            'disco' => ['disponible', 'ruta', 'total_bytes', 'usado_bytes', 'libre_bytes', 'porcentaje_usado'],
            'backups' => ['cantidad', 'total_bytes', 'cuota_bytes', 'porcentaje_cuota', 'huerfanos', 'maximo'],
            'archivos' => [['nombre', 'fecha', 'tamano_mb', 'tipo']],
            'proyeccion' => ['backups_hasta_cuota', 'tendencia_mb_por_backup'],
            'alertas',
            'estado',
        ]);
});

it('alerta cuando los backups superan la cuota configurada', function () {
    Configuracion::create(['clave' => 'backup_cuota_mb', 'valor' => '1']);

    Backup::create([
        'nombre' => 'backup-grande.sql.gz',
        'ruta' => 'backup-grande.sql.gz',
        'disco' => 'backups',
        'tipo' => Backup::TIPO_MANUAL,
        'estado' => Backup::ESTADO_COMPLETADO,
        'tamano_bytes' => 2 * 1048576,
        'protegido' => false,
    ]);

    $datos = app(BackupEspacioService::class)->calcular();

    expect($datos['backups']['porcentaje_cuota'])->toBe(200.0)
        ->and($datos['estado'])->toBe('critico');

    $niveles = array_column($datos['alertas'], 'nivel');

    expect($niveles)->toContain('danger');
});

it('calcula la proyección de backups hasta la cuota', function () {
    Configuracion::create(['clave' => 'backup_cuota_mb', 'valor' => '100']);

    Backup::create([
        'nombre' => 'backup-1.sql.gz',
        'ruta' => 'backup-1.sql.gz',
        'disco' => 'backups',
        'tipo' => Backup::TIPO_MANUAL,
        'estado' => Backup::ESTADO_COMPLETADO,
        'tamano_bytes' => 1048576,
        'protegido' => false,
    ]);

    $datos = app(BackupEspacioService::class)->calcular();

    expect($datos['proyeccion']['tendencia_mb_por_backup'])->toBe(1.0)
        ->and($datos['proyeccion']['backups_hasta_cuota'])->toBe(99);
});

it('incluye el último fallo como advertencia', function () {
    Backup::create([
        'nombre' => 'backup-fallido.sql.gz',
        'ruta' => 'backup-fallido.sql.gz',
        'disco' => 'backups',
        'tipo' => Backup::TIPO_AUTOMATICO,
        'estado' => Backup::ESTADO_FALLIDO,
        'error' => 'mysqldump no encontrado',
        'protegido' => false,
    ]);

    $datos = app(BackupEspacioService::class)->calcular();

    expect(array_column($datos['alertas'], 'mensaje'))
        ->toContain('El último backup falló: mysqldump no encontrado')
        ->and($datos['estado'])->toBe('atencion');
});
