<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backups', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 180);
            $table->string('nombre_original', 180)->nullable();
            $table->string('ruta', 255);
            $table->string('disco', 40)->default('backups');
            $table->enum('tipo', ['manual', 'automatico', 'pre_restauracion', 'importado']);
            $table->enum('estado', ['en_proceso', 'completado', 'fallido'])->default('en_proceso');
            $table->unsignedBigInteger('tamano_bytes')->nullable();
            $table->char('hash_sha256', 64)->nullable();
            $table->boolean('protegido')->default(false);
            // Sin FK a users: la tabla users puede ser MyISAM y MySQL no admite
            // FK entre InnoDB y MyISAM. La integridad se garantiza por aplicación.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['estado', 'created_at']);
            $table->index('tipo');
            $table->index('protegido');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backups');
    }
};
