<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('puestos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 255);
            $table->string('codigo', 30)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->foreignId('area_id')->constrained('areas')->restrictOnDelete();
            $table->timestamps();

            $table->index('area_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('puestos');
    }
};
