<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $huerfanos = DB::table('users')->whereNull('persona_id')->pluck('id');

        if ($huerfanos->isNotEmpty()) {
            throw new RuntimeException(
                'No se puede exigir users.persona_id: los usuarios con ID '
                .$huerfanos->implode(', ')
                .' no tienen persona vinculada. Asígnales una persona antes de migrar.'
            );
        }

        // La FK original se define en la migración de personas (nullOnDelete).
        // Se recrea como restrictOnDelete para impedir borrar una persona con usuario.
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign('users_persona_id_foreign');
            });

            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('persona_id')->nullable(false)->change();
            });

            Schema::table('users', function (Blueprint $table) {
                $table->foreign('persona_id', 'users_persona_id_foreign')
                    ->references('id')
                    ->on('personas')
                    ->restrictOnDelete();
            });
        }

        foreach (['name', 'phone', 'cargo', 'role'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                Schema::table('users', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('cargo', 255)->nullable();
            $table->string('role', 20)->default('user');
        });

        DB::table('users')
            ->select(['id', 'persona_id'])
            ->whereNotNull('persona_id')
            ->orderBy('id')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    $persona = DB::table('personas')
                        ->where('id', $user->persona_id)
                        ->first(['nombres', 'apellidos', 'telefono']);

                    if ($persona === null) {
                        continue;
                    }

                    DB::table('users')->where('id', $user->id)->update([
                        'name' => trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')),
                        'phone' => $persona->telefono,
                    ]);
                }
            });

        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign('users_persona_id_foreign');
            });

            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('persona_id')->nullable()->change();
            });

            Schema::table('users', function (Blueprint $table) {
                $table->foreign('persona_id', 'users_persona_id_foreign')
                    ->references('id')
                    ->on('personas')
                    ->nullOnDelete();
            });
        }
    }
};
