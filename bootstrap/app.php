<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EjecutarBackupVencido;
use App\Http\Middleware\HandleInertiaRequests;
use App\Support\FalloBaseDatos;
use App\Support\Modo;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            EjecutarBackupVencido::class,
        ]);

        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'role' => CheckRole::class,
            'permission' => CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! FalloBaseDatos::esConexion($e)) {
                return null;
            }

            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos minutos.',
                ], 503);
            }

            $modo = config('app.modo');

            return response()->view('errors.base-datos', [
                'etiqueta' => Modo::etiqueta($modo),
                'variante' => Modo::variante($modo),
            ], 503);
        });
    })->create();
