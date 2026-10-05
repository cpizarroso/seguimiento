<?php

namespace App\Providers;

use App\Models\Funcionario;
use App\Models\Tramite;
use App\Observers\FuncionarioObserver;
use App\Observers\TramiteObserver;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Builder::defaultStringLength(191);

        Funcionario::observe(FuncionarioObserver::class);
        Tramite::observe(TramiteObserver::class);
    }
}
