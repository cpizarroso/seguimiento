<?php

namespace Database\Factories;

use App\Models\Area;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class AreaFactory extends Factory
{
    protected $model = Area::class;

    public function definition(): array
    {
        $nombre = 'Área '.fake()->unique()->word();

        return [
            'nombre' => $nombre,
            'codigo' => Str::upper(fake()->unique()->bothify('AR-###')),
            'descripcion' => fake()->sentence(),
            'activo' => true,
            'area_padre_id' => null,
        ];
    }
}
