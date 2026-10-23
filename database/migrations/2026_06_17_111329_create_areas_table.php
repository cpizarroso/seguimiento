<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 255);
            $table->string('codigo', 20)->unique();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->foreignId('user_id')->nullable();
            $table->foreignId('area_padre_id')->nullable()
                ->constrained('areas')->nullOnDelete();
            $table->timestamps();

            $table->index('user_id');
            $table->index('area_padre_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};
