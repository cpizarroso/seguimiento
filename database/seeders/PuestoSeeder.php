<?php

namespace Database\Seeders;

use App\Models\Puesto;
use Illuminate\Database\Seeder;

class PuestoSeeder extends Seeder
{
    public function run(): void
    {
        $puestos = [
            [
                'nombre' => 'Secretaría General',
                'sigla' => 'SG',
                'descripcion' => 'Gestión documental y trámites administrativos generales',
                'estado' => true,
            ],
            [
                'nombre' => 'Oficina de Recursos Humanos',
                'sigla' => 'RRHH',
                'descripcion' => 'Gestión de personal y trámites laborales',
                'estado' => true,
            ],
            [
                'nombre' => 'Dirección Financiera',
                'sigla' => 'DF',
                'descripcion' => 'Gestión presupuestaria y trámites financieros',
                'estado' => true,
            ],
            [
                'nombre' => 'Asesoría Jurídica',
                'sigla' => 'AJ',
                'descripcion' => 'Revisión legal y trámites normativos',
                'estado' => true,
            ],
            [
                'nombre' => 'Unidad de Fiscalización',
                'sigla' => 'UF',
                'descripcion' => 'Control y supervisión de procesos',
                'estado' => true,
            ],
            [
                'nombre' => 'Departamento Técnico',
                'sigla' => 'DT',
                'descripcion' => 'Evaluación técnica y certificaciones',
                'estado' => true,
            ],
            [
                'nombre' => 'Mesa de Partes',
                'sigla' => 'MP',
                'descripcion' => 'Recepción y registro inicial de trámites',
                'estado' => true,
            ],
            [
                'nombre' => 'Archivo Central',
                'sigla' => 'AC',
                'descripcion' => 'Almacenamiento y custodia de expedientes',
                'estado' => true,
            ],
        ];

        foreach ($puestos as $puesto) {
            Puesto::create($puesto);
        }

        $this->command->info('Puestos creados exitosamente.');
    }
}
