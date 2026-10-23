<?php

namespace Database\Factories;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Database\Eloquent\Factories\Factory;

class PuestoFactory extends Factory
{
    protected $model = Puesto::class;

    public function definition(): array
    {
        return [
            'nombre' => fake()->randomElement([
                'SECRETARIA', 'PROFESIONAL', 'JEFE', 'ASISTENTE',
            ]),
            'codigo' => strtoupper(fake()->unique()->bothify('PU-####')),
            'descripcion' => fake()->sentence(),
            'activo' => true,
            'area_id' => Area::factory(),
        ];
    }
}
