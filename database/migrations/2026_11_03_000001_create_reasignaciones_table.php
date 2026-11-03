<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reasignaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tramite_id')->constrained()->cascadeOnDelete();

            // Sin FK hacia users: esa tabla es MyISAM y la integridad se
            // garantiza por aplicación (misma regla que backups.user_id).
            $table->unsignedBigInteger('solicitante_id');
            $table->unsignedBigInteger('resuelto_por_id')->nullable();

            $table->text('motivo');
            $table->string('estado', 20)->default('pendiente');
            $table->text('glosa_respuesta')->nullable();
            $table->foreignId('derivacion_id')->nullable()->constrained('derivaciones')->nullOnDelete();
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamps();

            $table->index(['tramite_id', 'estado']);
            $table->index('solicitante_id');
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reasignaciones');
    }
};
