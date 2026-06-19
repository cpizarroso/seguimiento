<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funcionarios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 255);
            $table->string('apellidos', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('direccion', 500)->nullable();
            $table->string('nro_telefono', 30)->nullable();
            $table->string('cedula_identidad', 30)->nullable()->unique();
            $table->string('tipo_funcionario', 20)->default('contrato');
            $table->string('nivel', 50)->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->string('estado', 20)->default('activo');
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('funcionarios');
    }
};
