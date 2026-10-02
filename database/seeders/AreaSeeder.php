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
            'nombre' => 'SECRETARIA MUNICIPAL DE PLANIFICACION',
            'sigla' => 'SEMPLA',
            'codigo' => 'SMPL',
            'descripcion' => 'Entidad encargada de la planificación del desarrollo municipal, la formulación de políticas, planes y programas, así como de la coordinación y seguimiento de la gestión pública local',
            'estado' => true,
        ]);

        $direcciones = [
            [
                'nombre' => 'DIRECCION LEGAL Y ADMINISTRATIVA',
                'sigla' => 'DLA',
                'codigo' => 'DLA',
                'descripcion' => 'Encargada del asesoramiento jurídico, la gestión administrativa, financiera y de recursos humanos de la secretaría',
            ],
            [
                'nombre' => 'DIRECCION DE ORDENAMIENTO TERRITORIAL',
                'sigla' => 'DOT',
                'codigo' => 'DOT',
                'descripcion' => 'Encargada de la planificación, regulación y control del uso del suelo y del ordenamiento territorial del municipio',
            ],
            [
                'nombre' => 'DIRECCION DE REGULACION URBANA',
                'sigla' => 'DRU',
                'codigo' => 'DRU',
                'descripcion' => 'Encargada de la regulación, autorización y fiscalización de las edificaciones y actividades urbanas',
            ],
            [
                'nombre' => 'DIRECCION DE PROYECTOS INTEGRALES',
                'sigla' => 'DPI',
                'codigo' => 'DPI',
                'descripcion' => 'Encargada de la formulación, evaluación y seguimiento de los proyectos integrales de inversión municipal',
            ],
        ];

        $puestosBase = [
            ['nombre' => 'Secretaria', 'sufijo' => 'SEC', 'descripcion' => 'Apoyo administrativo, atención al público y gestión documental'],
            ['nombre' => 'Profesional', 'sufijo' => 'PRO', 'descripcion' => 'Análisis, elaboración de informes y gestión de procesos técnicos'],
            ['nombre' => 'Mensajero', 'sufijo' => 'MEN', 'descripcion' => 'Distribución de correspondencia y apoyo logístico'],
            ['nombre' => 'Jefe', 'sufijo' => 'JEF', 'descripcion' => 'Dirección, coordinación y supervisión del personal y actividades'],
            ['nombre' => 'Asistente', 'sufijo' => 'ASI', 'descripcion' => 'Apoyo operativo y asistencia en las tareas del área'],
        ];

        $areas = [$sempla];

        foreach ($direcciones as $direccion) {
            $areas[] = Area::create([
                'nombre' => $direccion['nombre'],
                'sigla' => $direccion['sigla'],
                'codigo' => $direccion['codigo'],
                'descripcion' => $direccion['descripcion'],
                'estado' => true,
                'parent_id' => $sempla->id,
            ]);
        }

        foreach ($areas as $area) {
            $n = 1;
            foreach ($puestosBase as $puesto) {
                Puesto::create([
                    'nombre' => $puesto['nombre'],
                    'sigla' => "{$area->sigla}-{$puesto['sufijo']}",
                    'codigo' => sprintf('%s-%02d', $area->codigo, $n++),
                    'descripcion' => $puesto['descripcion'],
                    'estado' => true,
                    'area_id' => $area->id,
                ]);
            }
        }

        $this->command->info('Áreas y puestos creados exitosamente.');
    }
}
