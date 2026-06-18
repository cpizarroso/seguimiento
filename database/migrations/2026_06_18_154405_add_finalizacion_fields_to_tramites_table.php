<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tramites', function (Blueprint $table) {
            $table->text('glosa_finalizacion')->nullable()->after('ultima_respuesta');
            $table->dateTime('fecha_finalizacion')->nullable()->after('glosa_finalizacion');
            $table->foreignId('finalizado_por')->nullable()->constrained('users')->nullOnDelete()->after('fecha_finalizacion');
        });
    }

    public function down(): void
    {
        Schema::table('tramites', function (Blueprint $table) {
            $table->dropForeign(['finalizado_por']);
            $table->dropColumn(['glosa_finalizacion', 'fecha_finalizacion', 'finalizado_por']);
        });
    }
};
