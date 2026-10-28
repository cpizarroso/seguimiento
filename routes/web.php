<?php

use App\Http\Controllers\Actuaciones\ActuacionController;
use App\Http\Controllers\Areas\AreaController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Backups\BackupController;
use App\Http\Controllers\Backups\BackupRestauracionController;
use App\Http\Controllers\Configuracion\ConfiguracionController;
use App\Http\Controllers\Contador\ContadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Derivaciones\DerivacionController;
use App\Http\Controllers\Personas\PersonaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\Roles\RolController;
use App\Http\Controllers\Tramites\TramiteController;
use App\Http\Controllers\Users\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store']);
});

Route::post('/logout', [AuthController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => redirect()->route('tramites.index'));
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('tramites', [TramiteController::class, 'index'])->name('tramites.index');
    Route::get('tramites/exportar', [TramiteController::class, 'export'])->name('tramites.export');

    Route::middleware('permission:tramites,creacion')->group(function () {
        Route::get('tramites/create', [TramiteController::class, 'create'])->name('tramites.create');
        Route::post('tramites', [TramiteController::class, 'store'])->name('tramites.store');
    });

    Route::get('tramites/{tramite}', [TramiteController::class, 'show'])->name('tramites.show');

    Route::middleware('permission:tramites,edicion')->group(function () {
        Route::get('tramites/{tramite}/edit', [TramiteController::class, 'edit'])->name('tramites.edit');
        Route::put('tramites/{tramite}', [TramiteController::class, 'update'])->name('tramites.update');
        Route::put('tramites/{tramite}/estado', [TramiteController::class, 'updateEstado'])
            ->name('tramites.update-estado');
        Route::post('tramites/derivar-varios', [DerivacionController::class, 'derivarVarios'])
            ->name('tramites.derivar-varios');
        Route::post('tramites/{tramite}/derivar', [DerivacionController::class, 'derivar'])
            ->name('tramites.derivar');
        Route::put('derivaciones/{derivacion}/recepcionar', [DerivacionController::class, 'recepcionar'])
            ->name('derivaciones.recepcionar');
        Route::put('derivaciones/{derivacion}/rechazar', [DerivacionController::class, 'rechazar'])
            ->name('derivaciones.rechazar');
        Route::post('derivaciones/{derivacion}/actuaciones', [ActuacionController::class, 'store'])
            ->name('actuaciones.store');
        Route::delete('actuaciones/{actuacion}', [ActuacionController::class, 'destroy'])
            ->name('actuaciones.destroy');
    });

    Route::middleware('permission:tramites,baja')->group(function () {
        Route::delete('tramites/{tramite}', [TramiteController::class, 'destroy'])->name('tramites.destroy');
    });

    Route::get('reporte', [ReporteController::class, 'index'])->name('reporte.index');
    Route::get('reporte/vista-previa', [ReporteController::class, 'vistaPrevia'])->name('reporte.vista-previa');
    Route::post('reporte/guardar', [ReporteController::class, 'guardar'])->name('reporte.guardar');
    Route::get('reporte/descargar', [ReporteController::class, 'descargar'])->name('reporte.descargar');

    Route::middleware('permission:backups')->group(function () {
        Route::get('backups', [BackupController::class, 'index'])->name('backups.index');
        Route::get('backups/espacio', [BackupController::class, 'espacio'])->name('backups.espacio');
        Route::get('backups/{backup}/eventos', [BackupController::class, 'eventos'])
            ->name('backups.eventos');
    });

    Route::middleware('permission:backups,creacion')->group(function () {
        Route::post('backups', [BackupController::class, 'store'])->name('backups.store');
    });

    Route::middleware('permission:backups,edicion')->group(function () {
        Route::put('backups/automatizacion', [BackupController::class, 'updateAutomatizacion'])
            ->name('backups.automatizacion');
        Route::put('backups/{backup}/proteger', [BackupController::class, 'proteger'])
            ->name('backups.proteger');
    });

    Route::middleware('permission:backups,baja')->group(function () {
        Route::delete('backups/{backup}', [BackupController::class, 'destroy'])->name('backups.destroy');
    });

    Route::middleware('permission:backups,descarga')->group(function () {
        Route::get('backups/{backup}/descargar', [BackupController::class, 'descargar'])
            ->name('backups.descargar');
    });

    Route::middleware('permission:backups,restauracion')->group(function () {
        Route::post('backups/restaurar-archivo', [BackupRestauracionController::class, 'restaurarArchivo'])
            ->name('backups.restaurar-archivo');
        Route::post('backups/{backup}/restaurar', [BackupRestauracionController::class, 'restaurar'])
            ->name('backups.restaurar');
    });

    Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('configuracion', [ConfiguracionController::class, 'index'])->name('configuracion.index');
    Route::put('configuracion/per-page', [ConfiguracionController::class, 'updatePerPage'])->name('configuracion.per-page');
    Route::put('configuracion/reporte-gestion-inicial', [ConfiguracionController::class, 'updateGestionInicial'])
        ->middleware('permission:configuracion,edicion')
        ->name('configuracion.reporte-gestion-inicial');

    Route::middleware('permission:areas_puestos')->group(function () {
        Route::get('areas', [AreaController::class, 'index'])->name('areas.index');
        Route::post('areas', [AreaController::class, 'store'])->name('areas.store');
        Route::put('areas/{area}', [AreaController::class, 'update'])->name('areas.update');
        Route::delete('areas/{area}', [AreaController::class, 'destroy'])->name('areas.destroy');
        Route::put('areas/{area}/toggle', [AreaController::class, 'toggleActivo'])->name('areas.toggle');
        Route::post('areas/{area}/puestos', [AreaController::class, 'storePuesto'])->name('areas.puestos.store');
        Route::put('areas/{area}/puestos/{puesto}', [AreaController::class, 'updatePuesto'])->name('areas.puestos.update');
        Route::delete('areas/{area}/puestos/{puesto}', [AreaController::class, 'destroyPuesto'])->name('areas.puestos.destroy');
        Route::put('areas/{area}/puestos/{puesto}/toggle', [AreaController::class, 'togglePuesto'])->name('areas.puestos.toggle');
    });

    Route::middleware('permission:personas')->group(function () {
        Route::get('personas', [PersonaController::class, 'index'])->name('personas.index');
        Route::post('personas', [PersonaController::class, 'store'])->name('personas.store');
        Route::put('personas/{persona}', [PersonaController::class, 'update'])->name('personas.update');
        Route::delete('personas/{persona}', [PersonaController::class, 'destroy'])->name('personas.destroy');
        Route::put('personas/{persona}/toggle', [PersonaController::class, 'toggleActivo'])->name('personas.toggle');
        Route::put('personas/{persona}/puesto', [PersonaController::class, 'cambiarPuesto'])
            ->name('personas.puesto.update');
    });

    Route::middleware('permission:usuarios')->group(function () {
        Route::resource('users', UserController::class);
        Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('users.reset-password');
        Route::put('users/{user}/estado', [UserController::class, 'cambiarEstado'])
            ->name('users.estado.update');
    });

    Route::middleware('permission:roles')->group(function () {
        Route::resource('roles', RolController::class);
    });

    Route::middleware('permission:areas_puestos,creacion')->group(function () {
        Route::get('contador', [ContadorController::class, 'index'])->name('contador.index');
        Route::post('contador/reiniciar', [ContadorController::class, 'reiniciar'])
            ->name('contador.reiniciar');
    });
});
