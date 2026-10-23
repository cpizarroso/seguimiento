<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Services\AreaService;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        $sempla = Area::updateOrCreate(
            ['codigo' => 'SEMPLA'],
            [
                'nombre' => 'Secretaría de Planificación y Desarrollo',
                'descripcion' => 'Área raíz de la estructura organizacional.',
                'activo' => true,
                'area_padre_id' => null,
            ]
        );

        $dla = Area::updateOrCreate(
            ['codigo' => 'DLA'],
            [
                'nombre' => 'Dirección Legal y Administrativa',
                'descripcion' => 'Dirección dependiente de la Secretaría de Planificación y Desarrollo.',
                'activo' => true,
                'area_padre_id' => $sempla->id,
            ]
        );

        $leg = Area::updateOrCreate(
            ['codigo' => 'LEG'],
            [
                'nombre' => 'Área Legal',
                'descripcion' => 'Asesoría y gestión jurídica.',
                'activo' => true,
                'area_padre_id' => $dla->id,
            ]
        );

        $adm = Area::updateOrCreate(
            ['codigo' => 'ADM'],
            [
                'nombre' => 'Área Administrativa',
                'descripcion' => 'Gestión administrativa y financiera.',
                'activo' => true,
                'area_padre_id' => $dla->id,
            ]
        );

        foreach ([$sempla, $dla, $leg, $adm] as $area) {
            $this->crearPuestosEstandar($area);
        }
    }

    private function crearPuestosEstandar(Area $area): void
    {
        foreach (AreaService::PUESTOS_ESTANDAR as $puesto) {
            $area->puestos()->updateOrCreate(
                ['nombre' => $puesto['nombre']],
                [
                    'codigo' => "{$area->codigo}-{$puesto['sufijo']}",
                    'descripcion' => $puesto['descripcion'],
                    'activo' => true,
                ]
            );
        }
    }
}
