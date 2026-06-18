<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'nombre' => 'Administrativa',
                'sigla' => 'ADM',
                'descripcion' => 'Gestión administrativa general de la institución',
                'estado' => true,
                'puestos' => [
                    ['nombre' => 'Secretaria', 'sigla' => 'ADM-SEC', 'descripcion' => 'Apoyo administrativo y documental', 'estado' => true],
                    ['nombre' => 'Profesional', 'sigla' => 'ADM-PRO', 'descripcion' => 'Gestión de procesos administrativos', 'estado' => true],
                    ['nombre' => 'Jefe de Área', 'sigla' => 'ADM-JEF', 'descripcion' => 'Coordinación del área administrativa', 'estado' => true],
                ],
            ],
            [
                'nombre' => 'Legal',
                'sigla' => 'LEG',
                'descripcion' => 'Asesoría y trámites legales',
                'estado' => true,
                'puestos' => [
                    ['nombre' => 'Secretaria', 'sigla' => 'LEG-SEC', 'descripcion' => 'Apoyo administrativo legal', 'estado' => true],
                    ['nombre' => 'Profesional', 'sigla' => 'LEG-PRO', 'descripcion' => 'Análisis y dictámenes legales', 'estado' => true],
                    ['nombre' => 'Jefe de Área', 'sigla' => 'LEG-JEF', 'descripcion' => 'Coordinación del área legal', 'estado' => true],
                ],
            ],
            [
                'nombre' => 'Técnica',
                'sigla' => 'TEC',
                'descripcion' => 'Evaluación técnica y certificaciones',
                'estado' => true,
                'puestos' => [
                    ['nombre' => 'Secretaria', 'sigla' => 'TEC-SEC', 'descripcion' => 'Apoyo administrativo técnico', 'estado' => true],
                    ['nombre' => 'Profesional', 'sigla' => 'TEC-PRO', 'descripcion' => 'Evaluación y certificaciones técnicas', 'estado' => true],
                    ['nombre' => 'Jefe de Área', 'sigla' => 'TEC-JEF', 'descripcion' => 'Coordinación del área técnica', 'estado' => true],
                ],
            ],
            [
                'nombre' => 'Financiera',
                'sigla' => 'FIN',
                'descripcion' => 'Gestión presupuestaria y financiera',
                'estado' => true,
                'puestos' => [
                    ['nombre' => 'Secretaria', 'sigla' => 'FIN-SEC', 'descripcion' => 'Apoyo administrativo financiero', 'estado' => true],
                    ['nombre' => 'Profesional', 'sigla' => 'FIN-PRO', 'descripcion' => 'Gestión presupuestaria', 'estado' => true],
                    ['nombre' => 'Jefe de Área', 'sigla' => 'FIN-JEF', 'descripcion' => 'Coordinación del área financiera', 'estado' => true],
                ],
            ],
            [
                'nombre' => 'Recursos Humanos',
                'sigla' => 'RRHH',
                'descripcion' => 'Gestión del talento humano',
                'estado' => true,
                'puestos' => [
                    ['nombre' => 'Secretaria', 'sigla' => 'RHH-SEC', 'descripcion' => 'Apoyo administrativo de personal', 'estado' => true],
                    ['nombre' => 'Profesional', 'sigla' => 'RHH-PRO', 'descripcion' => 'Gestión de personal y nóminas', 'estado' => true],
                    ['nombre' => 'Jefe de Área', 'sigla' => 'RHH-JEF', 'descripcion' => 'Coordinación de recursos humanos', 'estado' => true],
                ],
            ],
        ];

        foreach ($areas as $areaData) {
            $puestos = $areaData['puestos'];
            unset($areaData['puestos']);

            $area = Area::create($areaData);

            foreach ($puestos as $puestoData) {
                $puestoData['area_id'] = $area->id;
                Puesto::create($puestoData);
            }
        }

        $this->command->info('Áreas y puestos creados exitosamente.');
    }
}
