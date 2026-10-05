<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actuaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('derivacion_id')->constrained('derivaciones')->cascadeOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->foreignId('funcionario_id')->nullable()->constrained('funcionarios')->nullOnDelete();
            $table->text('glosa');
            $table->timestamp('fecha_actuacion')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actuaciones');
    }
};
