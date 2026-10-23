<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('persona_puesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('persona_id')->constrained('personas')->cascadeOnDelete();
            $table->foreignId('puesto_id')->constrained('puestos')->restrictOnDelete();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->timestamps();

            // Garantiza un solo puesto vigente por persona sin afectar al historial.
            $table->unsignedBigInteger('persona_vigente_id')->nullable()
                ->storedAs('case when fecha_fin is null then persona_id else null end');
            $table->unique('persona_vigente_id', 'persona_puesto_vigente_unique');

            $table->index(['persona_id', 'fecha_fin'], 'persona_puesto_persona_fin_index');
            $table->index(['puesto_id', 'fecha_fin'], 'persona_puesto_puesto_fin_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('persona_puesto');
    }
};
