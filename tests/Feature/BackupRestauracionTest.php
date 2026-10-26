<?php

use App\Backups\Contrato\Dumper;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Models\Configuracion;
use App\Models\User;

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();
});

it('restaura un backup propio y crea la copia previa protegida', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);
    $dumper = app(Dumper::class);

    Configuracion::create(['clave' => 'backup_maximo', 'valor' => '7']);

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertRedirect(route('backups.index'))
        ->assertSessionHas('success');

    $pre = Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)->first();

    expect($pre)->not->toBeNull()
        ->and($pre->protegido)->toBeTrue()
        ->and($dumper->restauraciones)->toHaveCount(1)
        ->and($dumper->vaciados)->toBe(1);

    expect(BackupEvento::where('accion', BackupEvento::ACCION_RESTAURACION)->count())->toBe(1)
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_CREACION)->count())->toBe(2);

    // La configuración de backups se preserva aunque el archivo la pise.
    expect(Configuracion::where('clave', 'backup_maximo')->value('valor'))->toBe('7');
});

it('rechaza la restauración con contraseña incorrecta', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'incorrecta',
        ])
        ->assertSessionHasErrors('password');

    expect(app(Dumper::class)->restauraciones)->toBeEmpty()
        ->and(Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)->count())->toBe(0);
});

it('exige escribir RESTAURAR para confirmar', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'restaurar',
            'password' => 'password',
        ])
        ->assertSessionHasErrors('confirmacion');

    expect(app(Dumper::class)->restauraciones)->toBeEmpty();
});

it('revierte automáticamente cuando la importación falla', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    $dumper = app(Dumper::class);
    $dumper->fallarEnRestauracion = 1;

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertRedirect(route('backups.index'))
        ->assertSessionHas('error');

    expect(session('error'))->toContain('revirtió')
        ->and($dumper->restauraciones)->toHaveCount(2)
        ->and($dumper->vaciados)->toBe(2);

    $pre = Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)->first();

    expect($pre)->not->toBeNull()
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_FALLO)->count())->toBe(1)
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_FALLO)->value('detalle'))
        ->toContain('rollback=ok');
});

it('rechaza restaurar un backup que no está completado', function () {
    $admin = crearAdminBackups();

    $backup = Backup::create([
        'nombre' => 'backup-incompleto.sql.gz',
        'ruta' => 'backup-incompleto.sql.gz',
        'disco' => 'backups',
        'tipo' => Backup::TIPO_MANUAL,
        'estado' => Backup::ESTADO_FALLIDO,
        'protegido' => false,
        'user_id' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHas('error');

    expect(app(Dumper::class)->restauraciones)->toBeEmpty();
});

it('rechaza restaurar sin permiso de restauración', function () {
    $user = User::factory()->create();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $user->id);

    $this->actingAs($user)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertForbidden();

    expect(app(Dumper::class)->restauraciones)->toBeEmpty();
});
