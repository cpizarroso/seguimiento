<?php

use App\Backups\DiscosBackups;
use App\Models\Backup;
use App\Models\Configuracion;
use App\Services\BackupEspacioService;
use App\Services\BackupService;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * @return array<string, mixed>
 */
function datosAutomatizacion(array $extra = []): array
{
    return [
        'habilitado' => true,
        'frecuencia' => 'diaria',
        'hora' => '02:00',
        'dia_semana' => 1,
        'dia_mes' => 1,
        'maximo' => 10,
        'cuota_mb' => 0,
        'alerta_porcentaje' => 85,
        ...$extra,
    ];
}

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();

    $this->rutaBase = storage_path('framework/testing/destinos');

    config(['backups.destinos' => [
        ['id' => 'D', 'ruta' => $this->rutaBase, 'etiqueta' => 'D:'],
    ]]);
});

afterEach(function () {
    File::deleteDirectory(storage_path('framework/testing/destinos'));
});

it('guarda la unidad de destino en la configuración', function () {
    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->put(route('backups.automatizacion'), datosAutomatizacion(['destino' => 'D']))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    expect(app(DiscosBackups::class)->destinoActual())->toBe('D')
        ->and(Configuracion::where('clave', 'backup_destino')->value('valor'))->toBe('D')
        ->and(app(DiscosBackups::class)->activo())->toBe('backups-d')
        ->and(is_dir($this->rutaBase.DIRECTORY_SEPARATOR.'backup-seguimiento'))->toBeTrue();
});

it('vuelve al destino predeterminado sin unidad seleccionada', function () {
    Configuracion::create(['clave' => 'backup_destino', 'valor' => 'D']);

    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->put(route('backups.automatizacion'), datosAutomatizacion(['destino' => null]))
        ->assertSessionHasNoErrors();

    $discos = app(DiscosBackups::class);

    expect($discos->destinoActual())->toBeNull()
        ->and($discos->activo())->toBe('backups');
});

it('rechaza una unidad que no existe en el servidor', function () {
    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->put(route('backups.automatizacion'), datosAutomatizacion(['destino' => 'Z']))
        ->assertSessionHasErrors('destino');

    expect(Configuracion::where('clave', 'backup_destino')->exists())->toBeFalse();
});

it('guarda los backups nuevos en la unidad elegida', function () {
    Configuracion::create(['clave' => 'backup_destino', 'valor' => 'D']);

    Storage::fake('backups-d');

    $backup = crearBackupDePrueba();

    expect($backup->estado)->toBe(Backup::ESTADO_COMPLETADO)
        ->and($backup->disco)->toBe('backups-d')
        ->and(Storage::disk('backups-d')->exists($backup->ruta))->toBeTrue()
        ->and(Storage::disk('backups')->exists($backup->ruta))->toBeFalse();
});

it('mantiene operativos los backups guardados en el destino anterior', function () {
    $anterior = crearBackupDePrueba();

    Configuracion::create(['clave' => 'backup_destino', 'valor' => 'D']);
    Storage::fake('backups-d');

    $nuevo = crearBackupDePrueba();

    expect($anterior->disco)->toBe('backups')
        ->and($nuevo->disco)->toBe('backups-d');

    app(BackupService::class)->borrar($anterior->fresh(), 'prueba');

    expect(Storage::disk('backups')->exists($anterior->ruta))->toBeFalse()
        ->and(Backup::find($anterior->id))->toBeNull();
});

it('reporta el espacio de la unidad elegida', function () {
    Configuracion::create(['clave' => 'backup_destino', 'valor' => 'D']);

    $datos = app(BackupEspacioService::class)->calcular();

    $esperada = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $this->rutaBase.DIRECTORY_SEPARATOR.'backup-seguimiento');

    expect($datos['disco']['ruta'])->toBe($esperada);
});

it('falla de forma explícita si la unidad ya no está disponible', function () {
    Configuracion::create(['clave' => 'backup_destino', 'valor' => 'Q']);

    expect(fn () => app(BackupService::class)->crear(Backup::TIPO_MANUAL))
        ->toThrow(RuntimeException::class, 'no está disponible');

    $fallido = Backup::latest('id')->first();

    expect($fallido?->estado)->toBe(Backup::ESTADO_FALLIDO)
        ->and($fallido?->error)->toContain('no está disponible');
});
