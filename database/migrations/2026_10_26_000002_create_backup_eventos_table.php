<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backup_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backup_id')->nullable()->constrained('backups')->nullOnDelete();
            // Snapshot del nombre: la bitácora sobrevive al borrado del backup.
            $table->string('backup_nombre', 180);
            $table->enum('accion', [
                'creacion',
                'carga_externa',
                'descarga',
                'restauracion',
                'eliminacion',
                'fallo',
            ]);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('detalle')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['accion', 'created_at']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_eventos');
    }
};
