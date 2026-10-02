<?php

use App\Models\Funcionario;
use App\Models\FuncionarioPuesto;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funcionario_puesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('funcionario_id')->constrained('funcionarios')->cascadeOnDelete();
            $table->foreignId('puesto_id')->constrained('puestos')->cascadeOnDelete();
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['funcionario_id', 'fecha_inicio']);
        });

        $this->registrarPuestosActuales();
    }

    public function down(): void
    {
        Schema::dropIfExists('funcionario_puesto');
    }

    private function registrarPuestosActuales(): void
    {
        Funcionario::withTrashed()
            ->whereNotNull('puesto_id')
            ->orderBy('id')
            ->each(function (Funcionario $funcionario) {
                FuncionarioPuesto::query()->create([
                    'funcionario_id' => $funcionario->id,
                    'puesto_id' => $funcionario->puesto_id,
                    'area_id' => $funcionario->puesto?->area_id ?? $funcionario->area_id,
                    'fecha_inicio' => $funcionario->fecha_ingreso ?? $funcionario->created_at,
                    'fecha_fin' => null,
                    'creado_por' => $funcionario->creado_por,
                ]);
            });
    }
};
