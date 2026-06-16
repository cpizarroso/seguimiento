<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 100)->nullable()->unique()->after('email');
            $table->string('phone', 20)->nullable()->after('username');
            $table->string('profesion', 255)->nullable()->after('phone');
            $table->string('cargo', 255)->nullable()->after('profesion');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'profesion', 'cargo', 'username']);
        });
    }
};
