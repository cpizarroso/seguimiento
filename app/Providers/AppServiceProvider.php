<?php

namespace App\Providers;

use App\Backups\CliMySqlDumper;
use App\Backups\Contrato\Dumper;
use App\Models\Tramite;
use App\Observers\TramiteObserver;
use App\Support\BinarioMysql;
use Illuminate\Database\Schema\Builder;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(Dumper::class, function ($app): Dumper {
            return new CliMySqlDumper($app->make(BinarioMysql::class));
        });
    }

    public function boot(): void
    {
        Builder::defaultStringLength(191);

        Tramite::observe(TramiteObserver::class);
    }
}
