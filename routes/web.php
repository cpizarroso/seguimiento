<?php

use App\Http\Controllers\Areas\AreaController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Configuracion\ConfiguracionController;
use App\Http\Controllers\Contador\ContadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Derivaciones\DerivacionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Funcionarios\FuncionarioController;
use App\Http\Controllers\ReporteController;
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
    Route::get('tramites/create', [TramiteController::class, 'create'])->name('tramites.create');
    Route::get('tramites/{tramite}', [TramiteController::class, 'show'])->name('tramites.show');

    Route::post('tramites/{tramite}/derivar', [DerivacionController::class, 'derivar'])
        ->name('tramites.derivar');

    Route::put('derivaciones/{derivacion}/recepcionar', [DerivacionController::class, 'recepcionar'])
        ->name('derivaciones.recepcionar');

    Route::put('derivaciones/{derivacion}/rechazar', [DerivacionController::class, 'rechazar'])
        ->name('derivaciones.rechazar');

    Route::get('reporte', [ReporteController::class, 'index'])->name('reporte.index');
    Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('configuracion', [ConfiguracionController::class, 'index'])->name('configuracion.index');
    Route::put('configuracion/per-page', [ConfiguracionController::class, 'updatePerPage'])->name('configuracion.per-page');

    Route::middleware('role:admin')->group(function () {
        Route::resource('areas', AreaController::class);
        Route::post('areas/{area}/puestos', [AreaController::class, 'storePuesto'])->name('areas.puestos.store');
        Route::put('areas/{area}/puestos/{puesto}', [AreaController::class, 'updatePuesto'])->name('areas.puestos.update');
        Route::delete('areas/{area}/puestos/{puesto}', [AreaController::class, 'destroyPuesto'])->name('areas.puestos.destroy');
        Route::resource('funcionarios', FuncionarioController::class)->except(['show']);

        Route::post('tramites', [TramiteController::class, 'store'])->name('tramites.store');
        Route::delete('tramites/{tramite}', [TramiteController::class, 'destroy'])->name('tramites.destroy');

        Route::put('tramites/{tramite}/estado', [TramiteController::class, 'updateEstado'])
            ->name('tramites.update-estado');

        Route::get('contador', [ContadorController::class, 'index'])->name('contador.index');
        Route::post('contador/reiniciar', [ContadorController::class, 'reiniciar'])
            ->name('contador.reiniciar');

        Route::resource('users', UserController::class);
        Route::put('users/{user}/reset-password', [UserController::class, 'resetPassword'])
            ->name('users.reset-password');
    });
});
