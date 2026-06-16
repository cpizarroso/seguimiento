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

        $tieneRecepcion = fake()->boolean(60);

        return [
            'tramite_id' => Tramite::factory(),
            'numero_derivacion' => 1,
            'derivado_de' => $origenId,
            'derivado_a' => $destinoId,
            'fecha_derivacion' => fake()->dateTimeBetween('-5 months', 'now'),
            'glosa_derivacion' => fake()->optional(0.9)->sentence(),
            'fecha_recepcion' => $tieneRecepcion ? fake()->dateTimeBetween('-5 months', 'now') : null,
            'glosa_recepcion' => $tieneRecepcion ? fake()->optional(0.7)->sentence() : null,
            'estado' => $tieneRecepcion
                ? fake()->randomElement(['recepcionado', 'rechazado'])
                : 'derivado',
        ];
    }

    public function derivado(): static
    {
        return $this->state(fn () => [
            'fecha_recepcion' => null,
            'glosa_recepcion' => null,
            'estado' => 'derivado',
        ]);
    }

    public function recepcionado(): static
    {
        return $this->state(fn () => [
            'fecha_recepcion' => fake()->dateTimeBetween('-5 months', 'now'),
            'glosa_recepcion' => fake()->optional(0.7)->sentence(),
            'estado' => 'recepcionado',
        ]);
    }

    public function rechazado(): static
    {
        return $this->state(fn () => [
            'fecha_recepcion' => fake()->dateTimeBetween('-5 months', 'now'),
            'glosa_recepcion' => fake()->sentence(),
            'estado' => 'rechazado',
        ]);
    }

    public function historico(): static
    {
        return $this->state(fn () => [
            'fecha_recepcion' => fake()->dateTimeBetween('-5 months', 'now'),
            'glosa_recepcion' => fake()->optional(0.7)->sentence(),
            'estado' => 'historico',
        ]);
    }
}
