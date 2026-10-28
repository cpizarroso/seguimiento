<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->after('id');
        });

        Schema::table('personas', function (Blueprint $table) {
            $table->string('profesion', 255)->nullable()->after('correo');
        });

        $this->backfillUsernames();
        $this->backfillProfesion();

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 50)->nullable(false)->change();
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profesion');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profesion', 255)->nullable()->after('password');
        });

        DB::table('users')
            ->select(['id', 'persona_id'])
            ->whereNotNull('persona_id')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $profesion = DB::table('personas')->where('id', $user->persona_id)->value('profesion');

                    if ($profesion !== null) {
                        DB::table('users')->where('id', $user->id)->update(['profesion' => $profesion]);
                    }
                }
            });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });

        Schema::table('personas', function (Blueprint $table) {
            $table->dropColumn('profesion');
        });
    }

    private function backfillUsernames(): void
    {
        $usados = [];

        DB::table('users')
            ->select(['id', 'email'])
            ->orderBy('id')
            ->chunkById(200, function ($users) use (&$usados) {
                foreach ($users as $user) {
                    $base = $this->normalizarUsername((string) Str::before((string) $user->email, '@'), (int) $user->id);
                    $username = $base;
                    $sufijo = 1;

                    while (
                        isset($usados[$username])
                        || DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()
                    ) {
                        $username = $base.'-'.$sufijo++;
                    }

                    $usados[$username] = true;

                    DB::table('users')->where('id', $user->id)->update(['username' => $username]);
                }
            });
    }

    private function backfillProfesion(): void
    {
        DB::table('users')
            ->select(['id', 'persona_id', 'profesion'])
            ->whereNotNull('persona_id')
            ->whereNotNull('profesion')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('personas')
                        ->where('id', $user->persona_id)
                        ->whereNull('profesion')
                        ->update(['profesion' => $user->profesion]);
                }
            });
    }

    private function normalizarUsername(string $valor, int $id): string
    {
        $base = strtolower(trim($valor));
        $base = preg_replace('/[^a-z0-9._-]/', '', $base) ?? '';
        $base = trim($base, '.-_');

        return $base !== '' ? $base : 'usuario'.$id;
    }
};
