<?php

namespace Database\Factories;

use App\Models\Actuacion;
use App\Models\Area;
use App\Models\Derivacion;
use App\Models\Persona;
use App\Models\Tramite;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Actuacion>
 */
class ActuacionFactory extends Factory
{
    protected $model = Actuacion::class;

    public function definition(): array
    {
        return [
            'derivacion_id' => fn () => Derivacion::inRandomOrder()->value('id')
                ?? Tramite::factory()->create()->derivaciones()->firstOrFail()->id,
            'area_id' => fn () => Area::inRandomOrder()->value('id') ?? Area::factory()->create()->id,
            'persona_id' => fn () => Persona::inRandomOrder()->value('id') ?? Persona::factory()->create()->id,
            'glosa' => fake()->paragraph(),
            'fecha_actuacion' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }
}
