<?php

namespace Database\Factories;

use App\Models\Area;
use Illuminate\Database\Eloquent\Factories\Factory;

class AreaFactory extends Factory
{
    protected $model = Area::class;

    public function definition(): array
    {
        return [
            'nombre' => fake()->unique()->randomElement(['Administrativa', 'Legal', 'Técnica', 'Financiera']),
            'descripcion' => fake()->sentence(),
        ];
    }
}
