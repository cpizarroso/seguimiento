<?php

namespace Database\Factories;

use App\Models\Derivacion;
use App\Models\Tramite;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

class DerivacionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'tramite_id' => Tramite::factory(),
            'numero_derivacion' => 1,
            'derivado_de' => User::inRandomOrder()->value('id'),
            'derivado_a' => User::whereNotIn('id', [User::inRandomOrder()->value('id')])->inRandomOrder()->value('id'),
            'fecha_derivacion' => fake()->dateTimeBetween('-5 months', 'now'),
            'glosa_derivacion' => fake()->sentence(),
            'fecha_recepcion' => null,
            'glosa_recepcion' => null,
            'estado' => 'derivado',
        ];
    }

    public function crearCadena(Tramite $tramite, int $cantidad): void
    {
        $fechaActual = Carbon::parse($tramite->fecha);

        for ($i = 0; $i < $cantidad; $i++) {
            $ultima = Derivacion::where('tramite_id', $tramite->id)
                ->orderBy('numero_derivacion', 'desc')
                ->first();

            $numero = ($ultima?->numero_derivacion ?? 0) + 1;
            $fechaActual = $fechaActual->copy()->addDays(random_int(3, 15));

            if (!$ultima) {
                $destino = User::where('id', '!=', $tramite->creado_por)->inRandomOrder()->value('id') ?? User::inRandomOrder()->value('id');

                $tramite->update(['estado' => 'proceso', 'derivado_a' => $destino]);

                Derivacion::create([
                    'tramite_id' => $tramite->id,
                    'numero_derivacion' => $numero,
                    'derivado_de' => $tramite->creado_por,
                    'derivado_a' => $destino,
                    'fecha_derivacion' => $fechaActual->format('Y-m-d H:i:s'),
                    'glosa_derivacion' => fake()->sentence(),
                    'fecha_recepcion' => null,
                    'glosa_recepcion' => null,
                    'estado' => 'derivado',
                ]);

                continue;
            }

            if ($ultima->estado === 'derivado') {
                $ultima->update([
                    'estado' => 'recepcionado',
                    'fecha_recepcion' => $fechaActual->format('Y-m-d H:i:s'),
                    'glosa_recepcion' => fake()->optional(0.7)->sentence(),
                ]);
                continue;
            }

            if ($ultima->estado === 'recepcionado') {
                $ultima->update(['estado' => 'historico']);

                $destino = User::where('id', '!=', $ultima->derivado_a)->inRandomOrder()->value('id') ?? User::inRandomOrder()->value('id');

                $tramite->update(['derivado_a' => $destino]);

                Derivacion::create([
                    'tramite_id' => $tramite->id,
                    'numero_derivacion' => $numero,
                    'derivado_de' => $ultima->derivado_a,
                    'derivado_a' => $destino,
                    'fecha_derivacion' => $fechaActual->format('Y-m-d H:i:s'),
                    'glosa_derivacion' => fake()->sentence(),
                    'fecha_recepcion' => null,
                    'glosa_recepcion' => null,
                    'estado' => 'derivado',
                ]);
            }
        }
    }
}
