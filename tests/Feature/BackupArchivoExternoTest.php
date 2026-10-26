<?php

use App\Backups\Contrato\Dumper;
use App\Models\Backup;
use App\Models\BackupEvento;
use App\Services\BackupValidador;
use Illuminate\Http\UploadedFile;

function sqlDeBackupValido(): string
{
    return <<<'SQL'
SET NAMES utf8mb4;
CREATE TABLE `users` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `migrations` (`id` int unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `areas` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `personas` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `tramites` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
CREATE TABLE `derivaciones` (`id` bigint unsigned NOT NULL AUTO_INCREMENT, PRIMARY KEY (`id`));
INSERT INTO `areas` (`id`) VALUES (1);
SQL;
}

beforeEach(function () {
    prepararAlmacenBackups();
    usarDumperFalso();
});

it('importa y restaura un archivo .sql externo', function () {
    $admin = crearAdminBackups();

    $archivo = UploadedFile::fake()->createWithContent('respaldo.sql', sqlDeBackupValido());

    $this->actingAs($admin)
        ->post(route('backups.restaurar-archivo'), [
            'archivo' => $archivo,
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertRedirect(route('backups.index'))
        ->assertSessionHas('success');

    $importado = Backup::where('tipo', Backup::TIPO_IMPORTADO)->first();

    expect($importado)->not->toBeNull()
        ->and($importado->protegido)->toBeTrue()
        ->and($importado->nombre_original)->toBe('respaldo.sql')
        ->and($importado->estado)->toBe(Backup::ESTADO_COMPLETADO);

    expect(Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)->count())->toBe(1)
        ->and(app(Dumper::class)->restauraciones)->toHaveCount(1)
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_CARGA_EXTERNA)->count())->toBe(1)
        ->and(BackupEvento::where('accion', BackupEvento::ACCION_RESTAURACION)->count())->toBe(1);
});

it('importa y restaura un archivo .gz externo', function () {
    $admin = crearAdminBackups();

    $archivo = UploadedFile::fake()->createWithContent(
        'respaldo.sql.gz',
        gzencode(sqlDeBackupValido(), 6),
    );

    $this->actingAs($admin)
        ->post(route('backups.restaurar-archivo'), [
            'archivo' => $archivo,
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHas('success');

    expect(Backup::where('tipo', Backup::TIPO_IMPORTADO)->count())->toBe(1)
        ->and(app(Dumper::class)->restauraciones)->toHaveCount(1);
});

it('rechaza un archivo sin las tablas esperadas', function () {
    $admin = crearAdminBackups();

    $archivo = UploadedFile::fake()->createWithContent('otro.sql', 'CREATE TABLE foo (id int);');

    $this->actingAs($admin)
        ->post(route('backups.restaurar-archivo'), [
            'archivo' => $archivo,
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHasErrors('archivo');

    expect(Backup::where('tipo', Backup::TIPO_IMPORTADO)->count())->toBe(0);
});

it('rechaza una extensión no permitida', function () {
    $admin = crearAdminBackups();

    $archivo = UploadedFile::fake()->createWithContent('respaldo.txt', sqlDeBackupValido());

    $this->actingAs($admin)
        ->post(route('backups.restaurar-archivo'), [
            'archivo' => $archivo,
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHasErrors('archivo');
});

it('rechaza sentencias peligrosas en el archivo importado', function () {
    $admin = crearAdminBackups();

    $archivo = UploadedFile::fake()->createWithContent(
        'respaldo.sql',
        sqlDeBackupValido()."\nDROP DATABASE otra_base;",
    );

    $this->actingAs($admin)
        ->post(route('backups.restaurar-archivo'), [
            'archivo' => $archivo,
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHasErrors('archivo');
});

it('detecta archivos dañados antes de restaurar', function () {
    $admin = crearAdminBackups();
    $backup = crearBackupDePrueba(Backup::TIPO_MANUAL, $admin->id);

    // Se altera el archivo: el hash ya no coincide.
    \Illuminate\Support\Facades\Storage::disk('backups')->put(
        $backup->ruta,
        gzencode(sqlDeBackupValido()."\n-- alterado", 6),
    );

    $this->actingAs($admin)
        ->post(route('backups.restaurar', $backup), [
            'confirmacion' => 'RESTAURAR',
            'password' => 'password',
        ])
        ->assertSessionHas('error');

    expect(session('error'))->toContain('integridad')
        ->and(app(Dumper::class)->restauraciones)->toBeEmpty();
});

it('el validador respeta el límite máximo de importación', function () {
    $validador = app(BackupValidador::class);

    expect($validador->maximoBytes())->toBeGreaterThan(0);
});
