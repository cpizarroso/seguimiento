<?php

use App\Providers\AppServiceProvider;
use App\Providers\TypeScriptTransformerServiceProvider;

$providers = [
    AppServiceProvider::class,
];

// El transformer solo existe con dependencias de desarrollo (require-dev).
// En producción (composer install --no-dev) no se registra.
if (class_exists(\Spatie\LaravelTypeScriptTransformer\TypeScriptTransformerApplicationServiceProvider::class)) {
    $providers[] = TypeScriptTransformerServiceProvider::class;
}

return $providers;
