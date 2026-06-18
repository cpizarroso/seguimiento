<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tramites', function (Blueprint $table) {
            $table->id();
            $table->integer('numero_tramite');
            $table->integer('year');
            $table->dateTime('fecha');
            $table->text('descripcion');
            $table->string('numero_diamante', 255)->nullable();
            $table->string('estado', 50)->default('iniciado');
            $table->foreignId('area_id')->constrained('areas')->cascadeOnDelete();
            $table->foreignId('creado_por')->constrained('users')->cascadeOnDelete();
            $table->foreignId('derivado_a')->nullable()->constrained('users')->nullOnDelete();
            $table->text('ultima_respuesta')->nullable();
            $table->timestamps();

            $table->unique(['numero_tramite', 'year', 'area_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tramites');
    }
};
