<?php

use App\Backups\Contrato\Dumper;
use App\Models\Accion;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Models\Configuracion;
use App\Models\Modulo;
use App\Models\Permiso;
use App\Models\User;
use App\Services\BackupProgramacionService;
use App\Services\BackupService;
use Database\Seeders\PermisosBackupsSeeder;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();
});

it('crea un backup manual y registra el evento', function () {
    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->post(route('backups.store'))
        ->assertRedirect()
        ->assertSessionHas('success');

    $backup = Backup::first();

    expect($backup)->not->toBeNull()
        ->and($backup->estado)->toBe(Backup::ESTADO_COMPLETADO)
        ->and($backup->tipo)->toBe(Backup::TIPO_MANUAL)
        ->and($backup->protegido)->toBeFalse()
        ->and($backup->user_id)->toBe($admin->id)
        ->and($backup->tamano_bytes)->toBeGreaterThan(0)
        ->and($backup->hash_sha256)->toHaveLength(64)
        ->and($backup->nombre)->toContain('manual')
        ->and(Storage::disk('backups')->exists($backup->ruta))->toBeTrue();

    expect(BackupEvento::where('accion', BackupEvento::ACCION_CREACION)->count())->toBe(1);
});

it('rechaza la creación de backups sin permiso', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('backups.store'))->assertForbidden();
    $this->actingAs($user)->get(route('backups.index'))->assertForbidden();

    expect(Backup::count())->toBe(0);
});

it('aplica la retención eliminando los más antiguos no protegidos', function () {
    Configuracion::create(['clave' => 'backup_maximo', 'valor' => '2']);

    $admin = crearAdminBackups();

    $primero = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);
    $segundo = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);
    $tercero = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    expect(Backup::completados()->count())->toBe(2)
        ->and(Backup::whereKey($primero->id)->exists())->toBeFalse()
        ->and(Backup::whereKey($segundo->id)->exists())->toBeTrue()
        ->and(Backup::whereKey($tercero->id)->exists())->toBeTrue();

    expect(BackupEvento::where('accion', BackupEvento::ACCION_ELIMINACION)->count())->toBe(1);
});

it('nunca elimina por retención un backup protegido', function () {
    Configuracion::create(['clave' => 'backup_maximo', 'valor' => '1']);

    $admin = crearAdminBackups();

    $protegido = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id, true);
    crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    expect(Backup::whereKey($protegido->id)->exists())->toBeTrue()
        ->and(Backup::completados()->count())->toBe(1);
});

it('protege solo la pre-restauración más reciente', function () {
    $admin = crearAdminBackups();
    $servicio = app(BackupService::class);

    $primera = $servicio->crearPreRestauracion($admin->id);
    $segunda = $servicio->crearPreRestauracion($admin->id);

    expect($primera->fresh()->protegido)->toBeFalse()
        ->and($segunda->fresh()->protegido)->toBeTrue();
});

it('descarga un backup y audita la descarga', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    $respuesta = $this->actingAs($admin)->get(route('backups.descargar', $backup));

    $respuesta->assertOk();

    expect($respuesta->headers->get('content-disposition'))->toContain($backup->nombre)
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_DESCARGA)->count())->toBe(1);
});

it('no permite eliminar un backup protegido sin quitar la protección', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id, true);

    $this->actingAs($admin)
        ->delete(route('backups.destroy', $backup))
        ->assertSessionHas('error');

    expect(Backup::whereKey($backup->id)->exists())->toBeTrue();

    $this->actingAs($admin)
        ->put(route('backups.proteger', $backup), ['protegido' => false])
        ->assertSessionHas('success');

    $this->actingAs($admin)
        ->delete(route('backups.destroy', $backup))
        ->assertSessionHas('success');

    expect(Backup::whereKey($backup->id)->exists())->toBeFalse()
        ->and(Storage::disk('backups')->exists($backup->nombre))->toBeFalse();
});

it('registra un backup fallido cuando el volcado falla', function () {
    $admin = crearAdminBackups();

    app(Dumper::class)->fallaAlVolcar = true;

    $this->actingAs($admin)
        ->post(route('backups.store'))
        ->assertSessionHas('error');

    $backup = Backup::first();

    expect($backup->estado)->toBe(Backup::ESTADO_FALLIDO)
        ->and($backup->error)->toContain('Fallo simulado')
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_FALLO)->count())->toBe(1);
});

it('actualiza la automatización y fija la línea base', function () {
    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->put(route('backups.automatizacion'), [
            'habilitado' => true,
            'frecuencia' => 'semanal',
            'hora' => '03:30',
            'dia_semana' => 1,
            'dia_mes' => 1,
            'maximo' => 5,
            'cuota_mb' => 100,
            'alerta_porcentaje' => 80,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success');

    $config = app(BackupProgramacionService::class)->configuracion();

    expect($config['habilitado'])->toBeTrue()
        ->and($config['frecuencia'])->toBe('semanal')
        ->and($config['hora'])->toBe('03:30')
        ->and($config['maximo'])->toBe(5)
        ->and($config['cuota_mb'])->toBe(100)
        ->and($config['alerta_porcentaje'])->toBe(80)
        ->and($config['ultima_ejecucion'])->not->toBeNull()
        ->and($config['proxima_ejecucion'])->not->toBeNull();
});

it('valida los datos de la automatización', function () {
    $admin = crearAdminBackups();

    $this->actingAs($admin)
        ->put(route('backups.automatizacion'), [
            'habilitado' => true,
            'frecuencia' => 'cada_hora',
            'hora' => '25:00',
            'maximo' => 0,
            'cuota_mb' => -1,
            'alerta_porcentaje' => 120,
        ])
        ->assertSessionHasErrors(['frecuencia', 'hora', 'maximo', 'cuota_mb', 'alerta_porcentaje']);
});

it('expone el panel de backups con sus permisos', function () {
    $admin = crearAdminBackups();
    crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    $this->actingAs($admin)
        ->get(route('backups.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 1)
            ->where('puede.crear', true)
            ->where('puede.editar', true)
            ->where('puede.eliminar', true)
            ->where('puede.descargar', true)
            ->where('puede.restaurar', true)
            ->has('espacio.disco')
            ->has('espacio.alertas')
            ->has('automatizacion')
            ->has('historial')
        );
});

it('el seeder de permisos es idempotente y asigna los seis permisos al admin', function () {
    $admin = crearAdminBackups();

    $this->seed(PermisosBackupsSeeder::class);
    $this->seed(PermisosBackupsSeeder::class);

    $permisos = Permiso::whereHas('modulo', fn ($query) => $query->where('slug', 'backups'))->count();

    expect(Modulo::where('slug', 'backups')->count())->toBe(1)
        ->and(Accion::whereIn('slug', ['descarga', 'restauracion'])->count())->toBe(2)
        ->and($permisos)->toBe(6);

    $admin = $admin->fresh();
    $asignados = $admin->roles->first()->permisos()
        ->whereHas('modulo', fn ($query) => $query->where('slug', 'backups'))
        ->count();

    expect($asignados)->toBe(6);
});
