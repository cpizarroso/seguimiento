<?php

namespace Database\Factories;

use App\Models\Funcionario;
use Illuminate\Database\Eloquent\Factories\Factory;

class TramiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'codigo' => 'TR-' . fake()->unique()->bothify('####-??##'),
            'titulo' => fake()->randomElement([
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
            'descripcion' => fake()->optional(0.8)->paragraph(),
            'estado' => fake()->randomElement([
                'pendiente',
                'en_progreso',
                'en_progreso',
                'completado',
                'cancelado',
            ]),
            'fecha_inicio' => fake()->dateTimeBetween('-6 months', '-1 month')->format('Y-m-d'),
            'fecha_fin' => null,
            'funcionario_id' => Funcionario::inRandomOrder()->first()?->id,
        ];
    }

    public function completado(): static
    {
        return $this->state(fn (array $attrs) => [
            'estado' => 'completado',
            'fecha_fin' => fake()->dateTimeBetween($attrs['fecha_inicio'] ?? '-3 months', 'now')->format('Y-m-d'),
        ]);
    }

    public function cancelado(): static
    {
        return $this->state(fn (array $attrs) => [
            'estado' => 'cancelado',
            'fecha_fin' => null,
        ]);
    }
}
