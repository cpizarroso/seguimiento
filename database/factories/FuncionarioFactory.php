<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class FuncionarioFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->firstName(),
            'apellido' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'telefono' => fake()->optional()->phoneNumber(),
            'cargo' => fake()->randomElement([
                'Analista',
                'Supervisor',
                'Coordinador',
                'Director',
                'Asistente',
                'Secretario',
                'Técnico',
                'Jefe de Área',
            ]),
            'activo' => fake()->boolean(90),
        ];
    }
}
