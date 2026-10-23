<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('area_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('area_id')->constrained('areas')->cascadeOnDelete();
            $table->boolean('predeterminada')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'area_id'], 'area_user_user_area_unique');

            // Garantiza una sola área predeterminada por usuario.
            $table->unsignedBigInteger('usuario_predeterminado_id')->nullable()
                ->storedAs('case when predeterminada = 1 then user_id else null end');
            $table->unique('usuario_predeterminado_id', 'area_user_predeterminada_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('area_user');
    }
};
