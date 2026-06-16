<?php

use App\Http\Controllers\Contador\ContadorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Derivaciones\DerivacionController;
use App\Http\Controllers\Funcionarios\FuncionarioController;
use App\Http\Controllers\Puestos\PuestoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\Tramites\TramiteController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('tramites.index'));
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::resource('puestos', PuestoController::class)->except(['show']);
Route::resource('funcionarios', FuncionarioController::class)->except(['show']);
Route::resource('tramites', TramiteController::class)->only(['index', 'create', 'store', 'show', 'destroy']);

Route::put('tramites/{tramite}/estado', [TramiteController::class, 'updateEstado'])
    ->name('tramites.update-estado');

Route::post('tramites/{tramite}/derivar', [DerivacionController::class, 'derivar'])
    ->name('tramites.derivar');

Route::put('derivaciones/{derivacion}/recepcionar', [DerivacionController::class, 'recepcionar'])
    ->name('derivaciones.recepcionar');

Route::put('derivaciones/{derivacion}/rechazar', [DerivacionController::class, 'rechazar'])
    ->name('derivaciones.rechazar');

Route::get('reporte', [ReporteController::class, 'index'])->name('reporte.index');

Route::get('contador', [ContadorController::class, 'index'])
    ->name('contador.index');

Route::post('contador/reiniciar', [ContadorController::class, 'reiniciar'])
    ->name('contador.reiniciar');
