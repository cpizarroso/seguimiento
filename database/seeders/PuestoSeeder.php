<?php

namespace Database\Seeders;

use App\Models\Puesto;
use Illuminate\Database\Seeder;

class PuestoSeeder extends Seeder
{
    public function run(): void
    {
        $puestos = [
            ['nombre' => 'Secretaría General', 'descripcion' => 'Gestión documental y trámites administrativos generales'],
            ['nombre' => 'Oficina de Recursos Humanos', 'descripcion' => 'Gestión de personal y trámites laborales'],
            ['nombre' => 'Dirección Financiera', 'descripcion' => 'Gestión presupuestaria y trámites financieros'],
            ['nombre' => 'Asesoría Jurídica', 'descripcion' => 'Revisión legal y trámites normativos'],
            ['nombre' => 'Unidad de Fiscalización', 'descripcion' => 'Control y supervisión de procesos'],
            ['nombre' => 'Departamento Técnico', 'descripcion' => 'Evaluación técnica y certificaciones'],
            ['nombre' => 'Mesa de Partes', 'descripcion' => 'Recepción y registro inicial de trámites'],
            ['nombre' => 'Archivo Central', 'descripcion' => 'Almacenamiento y custodia de expedientes'],
        ];

        foreach ($puestos as $puesto) {
            Puesto::create($puesto);
        }
    }
}
