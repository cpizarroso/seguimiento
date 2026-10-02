<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unique('funcionario_id', 'users_funcionario_id_unique');
            $table->foreign('funcionario_id', 'users_funcionario_id_foreign')
                ->references('id')
                ->on('funcionarios')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign('users_funcionario_id_foreign');
            $table->dropUnique('users_funcionario_id_unique');
        });
    }
};
