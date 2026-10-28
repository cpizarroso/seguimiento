<?php

namespace Database\Factories;

use App\Models\Persona;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Persona>
 */
class PersonaFactory extends Factory
{
    protected $model = Persona::class;

    public function definition(): array
    {
        return [
            'nombres' => fake()->firstName(),
            'apellidos' => fake()->lastName(),
            'ci' => fake()->unique()->numerify('########'),
            'telefono' => fake()->optional()->phoneNumber(),
            'correo' => fake()->unique()->safeEmail(),
            'profesion' => fake()->optional()->jobTitle(),
            'direccion' => fake()->optional()->address(),
            'activo' => true,
        ];
    }

    public function inactivo(): static
    {
        return $this->state(fn () => ['activo' => false]);
    }
}
