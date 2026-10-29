<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permiso_user', function (Blueprint $table) {
            $table->id();
            // Sin FK: `users` y `permisos` son MyISAM, que no soporta claves foráneas.
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('permiso_id');
            $table->boolean('permitido');
            $table->timestamps();

            $table->index('user_id', 'permiso_user_user_index');
            $table->index('permiso_id', 'permiso_user_permiso_index');
            $table->unique(['user_id', 'permiso_id'], 'permiso_user_user_permiso_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permiso_user');
    }
};
