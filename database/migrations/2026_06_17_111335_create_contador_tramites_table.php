<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contador_tramites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained('areas')->cascadeOnDelete();
            $table->integer('year');
            $table->integer('ultimo_numero')->default(0);
            $table->text('reset_glosa')->nullable();
            $table->timestamp('ultimo_reset_at')->nullable();
            $table->timestamps();

            $table->unique(['area_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contador_tramites');
    }
};
