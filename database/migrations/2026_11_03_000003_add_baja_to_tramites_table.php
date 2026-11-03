<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tramites', function (Blueprint $table) {
            $table->text('glosa_baja')->nullable()->after('glosa_finalizacion');
            $table->dateTime('fecha_baja')->nullable()->after('glosa_baja');
            $table->unsignedBigInteger('dado_de_baja_por')->nullable()->after('fecha_baja');
        });
    }

    public function down(): void
    {
        Schema::table('tramites', function (Blueprint $table) {
            $table->dropColumn(['glosa_baja', 'fecha_baja', 'dado_de_baja_por']);
        });
    }
};
