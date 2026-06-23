<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Puesto;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $sempla = Area::create([
            'nombre' => 'Secretaria Municipal de Planificación',
            'sigla' => 'SEMPLA',
            'descripcion' => 'Órgano encargado de la planificación municipal, coordinación de políticas públicas y gestión del desarrollo institucional',
            'estado' => true,
        ]);

        $adm = Area::create([
            'nombre' => 'Administración',
            'sigla' => 'ADM',
            'descripcion' => 'Gestión administrativa, recursos humanos y servicios generales',
            'estado' => true,
            'parent_id' => $sempla->id,
        ]);

        $legal = Area::create([
            'nombre' => 'Legal',
            'sigla' => 'LEG',
            'descripcion' => 'Asesoría jurídica, procesos legales y normativa interna',
            'estado' => true,
            'parent_id' => $sempla->id,
        ]);

        $dot = Area::create([
            'nombre' => 'Dirección de Ordenamiento Territorial',
            'sigla' => 'DOT',
            'descripcion' => 'Planificación y gestión del ordenamiento territorial municipal',
            'estado' => true,
            'parent_id' => $sempla->id,
        ]);

        $puestos = [
            'SEMPLA' => [
                ['nombre' => 'Secretaria', 'sigla' => 'SEM-SEC', 'descripcion' => 'Apoyo administrativo y documental', 'estado' => true],
                ['nombre' => 'Profesional', 'sigla' => 'SEM-PRO', 'descripcion' => 'Gestión de procesos técnicos', 'estado' => true],
                ['nombre' => 'Jefe de Área', 'sigla' => 'SEM-JEF', 'descripcion' => 'Coordinación de planificación', 'estado' => true],
            ],
            'ADM' => [
                ['nombre' => 'Secretaria', 'sigla' => 'ADM-SEC', 'descripcion' => 'Apoyo administrativo', 'estado' => true],
                ['nombre' => 'Profesional', 'sigla' => 'ADM-PRO', 'descripcion' => 'Gestión de procesos administrativos', 'estado' => true],
                ['nombre' => 'Jefe de Área', 'sigla' => 'ADM-JEF', 'descripcion' => 'Coordinación del área administrativa', 'estado' => true],
            ],
            'LEG' => [
                ['nombre' => 'Secretaria', 'sigla' => 'LEG-SEC', 'descripcion' => 'Apoyo administrativo legal', 'estado' => true],
                ['nombre' => 'Profesional', 'sigla' => 'LEG-PRO', 'descripcion' => 'Análisis y dictámenes legales', 'estado' => true],
                ['nombre' => 'Jefe de Área', 'sigla' => 'LEG-JEF', 'descripcion' => 'Coordinación del área legal', 'estado' => true],
            ],
            'DOT' => [
                ['nombre' => 'Departamento de Cartografía', 'sigla' => 'DOT-CAR', 'descripcion' => 'Elaboración y actualización de cartografía municipal', 'estado' => true],
                ['nombre' => 'Departamento de Topografía', 'sigla' => 'DOT-TOP', 'descripcion' => 'Levantamientos topográficos y georreferenciación', 'estado' => true],
            ],
        ];

        foreach ([$sempla, $adm, $legal, $dot] as $area) {
            foreach ($puestos[$area->sigla] as $puestoData) {
                $puestoData['area_id'] = $area->id;
                Puesto::create($puestoData);
            }
        }

        $this->command->info('Áreas y puestos creados exitosamente.');
    }
}
