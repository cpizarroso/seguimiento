<?php

namespace Database\Factories;

use App\Models\Funcionario;
use App\Models\Tramite;
use Illuminate\Database\Eloquent\Factories\Factory;

class DerivacionFactory extends Factory
{
    public function definition(): array
    {
        $funcionarios = Funcionario::pluck('id')->toArray();
        $origenId = fake()->randomElement($funcionarios);

        do {
            $destinoId = fake()->randomElement($funcionarios);
        } while ($destinoId === $origenId);

        return [
            'tramite_id' => Tramite::factory(),
            'funcionario_origen_id' => $origenId,
            'funcionario_destino_id' => $destinoId,
            'observacion' => fake()->optional(0.9)->sentence(),
            'fecha_derivacion' => fake()->dateTimeBetween('-5 months', 'now'),
        ];
    }
}
