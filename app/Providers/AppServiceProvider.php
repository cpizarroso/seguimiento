<?php

namespace App\Providers;

use App\Models\Funcionario;
use App\Observers\FuncionarioObserver;
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
    }
}
