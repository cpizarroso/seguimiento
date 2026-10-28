<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->select(['id', 'persona_id', 'email'])
            ->whereNotNull('persona_id')
            ->whereNotNull('email')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('personas')
                        ->where('id', $user->persona_id)
                        ->where(function ($query) {
                            $query->whereNull('correo')->orWhere('correo', '');
                        })
                        ->update(['correo' => $user->email]);
                }
            });

        $sinCorreo = DB::table('personas')
            ->where(function ($query) {
                $query->whereNull('correo')->orWhere('correo', '');
            })
            ->pluck('id');

        if ($sinCorreo->isNotEmpty()) {
            throw new RuntimeException(
                'No se puede exigir personas.correo: las personas con ID '
                .$sinCorreo->implode(', ')
                .' no tienen correo. Complétalos antes de migrar.'
            );
        }

        $duplicados = DB::table('personas')
            ->select('correo')
            ->whereNotNull('correo')
            ->groupBy('correo')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('correo');

        if ($duplicados->isNotEmpty()) {
            throw new RuntimeException(
                'No se puede crear el índice único de personas.correo: hay correos duplicados ('
                .$duplicados->implode(', ')
                .').'
            );
        }

        // La tabla personas es MyISAM (límite de 1000 bytes por índice) y
        // correo es varchar(255) utf8mb4, así que se usa un índice prefijo.
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('personas', function (Blueprint $table) {
                $table->unique('correo');
            });
        } else {
            DB::statement('ALTER TABLE personas ADD UNIQUE personas_correo_unique (correo(191))');
        }

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('personas', function (Blueprint $table) {
                $table->string('correo', 255)->nullable(false)->change();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('personas', function (Blueprint $table) {
                $table->dropUnique(['correo']);
            });
        } else {
            DB::statement('ALTER TABLE personas DROP INDEX personas_correo_unique');
        }

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('personas', function (Blueprint $table) {
                $table->string('correo', 255)->nullable()->change();
            });
        }
    }
};
