<?php

namespace Database\Factories;

use App\Models\Area;
use Illuminate\Database\Eloquent\Factories\Factory;

class FuncionarioFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->firstName(),
            'apellidos' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'nro_telefono' => fake()->optional()->phoneNumber(),
            'cedula_identidad' => fake()->unique()->numerify('########'),
            'direccion' => fake()->optional()->address(),
            'tipo_funcionario' => fake()->randomElement(['contrato', 'item']),
            'nivel' => fake()->randomElement(['Analista', 'Supervisor', 'Jefe', 'Asistente', 'Técnico']),
            'area_id' => Area::inRandomOrder()->first()?->id ?? Area::factory(),
            'fecha_ingreso' => fake()->dateTimeBetween('-5 years', '-1 month'),
            'estado' => fake()->randomElement(['activo', 'activo', 'activo', 'inactivo']),
        ];
    }

    public function activo(): static
    {
        return $this->state(fn (array $attrs) => ['estado' => 'activo']);
    }

    public function inactivo(): static
    {
        return $this->state(fn (array $attrs) => ['estado' => 'inactivo']);
    }
}
