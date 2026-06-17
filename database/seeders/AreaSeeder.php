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
                'descripcion' => 'Gestión administrativa general de la institución',
                'puestos' => ['Secretaria', 'Profesional', 'Jefe de Área'],
            ],
            [
                'nombre' => 'Legal',
                'descripcion' => 'Asesoría y trámites legales',
                'puestos' => ['Secretaria', 'Profesional', 'Jefe de Área'],
            ],
        ];

        foreach ($areas as $areaData) {
            $puestos = $areaData['puestos'];
            unset($areaData['puestos']);

            $area = Area::create($areaData);

            foreach ($puestos as $puestoNombre) {
                Puesto::create([
                    'nombre' => $puestoNombre,
                    'descripcion' => "Puesto de {$puestoNombre} en el área {$area->nombre}",
                    'area_id' => $area->id,
                ]);
            }
        }

        $this->command->info('Áreas y puestos creados exitosamente.');
    }
}
