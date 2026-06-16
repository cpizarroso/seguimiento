<?php

namespace Database\Factories;

use App\Models\Puesto;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TramiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'numero_tramite' => fake()->unique()->numberBetween(1, 9999),
            'year' => (int) fake()->year(),
            'fecha' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'descripcion' => fake()->randomElement([
                'Solicitud de permiso municipal',
                'Registro de propiedad intelectual',
                'Licencia de funcionamiento',
                'Certificado de antecedentes',
                'Solicitud de beca educativa',
                'Permiso de construcción',
                'Registro sanitario de producto',
                'Solicitud de jubilación',
                'Trámite de pasaporte',
                'Cambio de domicilio fiscal',
                'Inscripción al padrón electoral',
                'Solicitud de subsidio habitacional',
                'Permiso ambiental',
                'Reconocimiento de firma',
                'Legalización de documentos',
                'Solicitud de visa',
                'Registro de marca comercial',
                'Permiso de importación',
                'Certificado de origen',
                'Afiliación al sistema de salud',
                'Solicitud de crédito hipotecario',
                'Trámite de sucesión hereditaria',
                'Registro de vehículo automotor',
                'Cambio de nombre',
                'Solicitud de asilo',
                'Permiso de exportación',
                'Certificado de defunción',
                'Registro de unión civil',
                'Solicitud de pensión alimenticia',
                'Trámite de naturalización',
                'Licencia de conducir',
                'Permiso de demolición',
                'Solicitud de conexión de agua',
                'Registro de obra intelectual',
                'Certificado médico oficial',
                'Solicitud de catastro',
                'Trámite aduanero',
                'Permiso de eventos públicos',
                'Solicitud de beca deportiva',
                'Registro de función de teatro',
            ]),
            'numero_diamante' => fake()->optional(0.3)->bothify('DIA-####'),
            'glosa' => fake()->optional(0.5)->sentence(),
            'estado' => fake()->randomElement([
                'iniciado',
                'proceso',
                'proceso',
                'observado',
                'finalizado',
            ]),
            'puesto_id' => Puesto::inRandomOrder()->value('id'),
            'creado_por' => User::inRandomOrder()->value('id'),
            'derivado_a' => User::inRandomOrder()->value('id'),
        ];
    }

    public function iniciado(): static
    {
        return $this->state(fn () => ['estado' => 'iniciado']);
    }

    public function proceso(): static
    {
        return $this->state(fn () => ['estado' => 'proceso']);
    }

    public function observado(): static
    {
        return $this->state(fn () => ['estado' => 'observado']);
    }

    public function finalizado(): static
    {
        return $this->state(fn () => ['estado' => 'finalizado']);
    }
}
