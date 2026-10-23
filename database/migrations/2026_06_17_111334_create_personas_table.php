<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personas', function (Blueprint $table) {
            $table->id();
            $table->string('nombres', 255);
            $table->string('apellidos', 255);
            $table->string('ci', 30)->unique();
            $table->string('telefono', 30)->nullable();
            $table->string('correo', 255)->nullable();
            $table->string('direccion', 500)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index('activo');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('persona_id', 'users_persona_id_foreign')
                ->references('id')
                ->on('personas')
                ->nullOnDelete();
        });

        Schema::table('areas', function (Blueprint $table) {
            $table->foreign('user_id', 'areas_user_id_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            $table->dropForeign('areas_user_id_foreign');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign('users_persona_id_foreign');
        });

        Schema::dropIfExists('personas');
    }
};
