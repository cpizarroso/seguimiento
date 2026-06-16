<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('derivaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tramite_id')->constrained()->cascadeOnDelete();
            $table->integer('numero_derivacion');
            $table->foreignId('derivado_de')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('derivado_a')->constrained('users')->cascadeOnDelete();
            $table->timestamp('fecha_derivacion')->useCurrent();
            $table->text('glosa_derivacion')->nullable();
            $table->timestamp('fecha_recepcion')->nullable();
            $table->text('glosa_recepcion')->nullable();
            $table->string('estado', 50)->default('derivado');
            $table->timestamps();

            $table->unique(['tramite_id', 'numero_derivacion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('derivaciones');
    }
};
