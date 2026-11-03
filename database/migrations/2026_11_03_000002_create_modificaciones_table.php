<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tramite_id')->constrained()->cascadeOnDelete();

            // Sin FK hacia users: esa tabla es MyISAM y la integridad se
            // garantiza por aplicación (misma regla que reasignaciones).
            $table->unsignedBigInteger('solicitante_id');
            $table->unsignedBigInteger('resuelto_por_id')->nullable();

            $table->string('tipo', 20);
            $table->text('motivo');
            $table->text('propuesta')->nullable();
            $table->string('estado', 20)->default('pendiente');
            $table->text('glosa_respuesta')->nullable();
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamp('fecha_uso')->nullable();
            $table->timestamps();

            $table->index(['tramite_id', 'estado']);
            $table->index(['tramite_id', 'tipo', 'estado']);
            $table->index('solicitante_id');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modificaciones');
    }
};
