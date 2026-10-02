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
        $sigla = strtoupper(fake()->unique()->bothify('??'));

        return [
            'nombre' => fake()->unique()->randomElement([
                'Secretaria', 'Profesional', 'Jefe de Área',
            ]),
            'sigla' => $sigla,
            'codigo' => strtoupper(fake()->unique()->bothify('PU-####')),
            'descripcion' => fake()->sentence(),
            'area_id' => Area::factory(),
        ];
    }
}
