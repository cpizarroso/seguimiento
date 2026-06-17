<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 100)->nullable()->unique()->after('email');
            $table->renameColumn('nro_telefono', 'phone');
            $table->foreignId('funcionario_id')->nullable()->after('cargo')->constrained('funcionarios')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('phone', 'nro_telefono');
            $table->dropForeign(['funcionario_id']);
            $table->dropColumn(['username', 'funcionario_id']);
        });
    }
};
