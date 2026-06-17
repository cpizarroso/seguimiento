<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Puesto;
use Illuminate\Database\Seeder;

class FuncionarioSeeder extends Seeder
{
    public function run(): void
    {
        $adminArea = Area::where('nombre', 'Administrativa')->first();
        $legalArea = Area::where('nombre', 'Legal')->first();

        $puestoAdmin = fn ($nombre) => Puesto::where('nombre', $nombre)->where('area_id', $adminArea->id)->first()->id;
        $puestoLegal = fn ($nombre) => Puesto::where('nombre', $nombre)->where('area_id', $legalArea->id)->first()->id;

        $funcionarios = [
            // Mesa de Partes (se asigna a Secretaria Administrativa)
            ['nombre' => 'Carlos Mendoza', 'email' => 'cmendoza@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Secretaria')],
            ['nombre' => 'Rosa Quispe', 'email' => 'rquispe@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Secretaria')],

            // Profesionales Administrativos
            ['nombre' => 'Ana Vargas', 'email' => 'avargas@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Profesional')],
            ['nombre' => 'Pedro Mamani', 'email' => 'pmamani@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Profesional')],

            // Jefes Administrativos
            ['nombre' => 'Lucía Flores', 'email' => 'lflores@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Jefe de Área')],
            ['nombre' => 'Jorge Ríos', 'email' => 'jrios@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Jefe de Área')],

            // Secretaria Legal
            ['nombre' => 'María Luna', 'email' => 'mluna@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Secretaria')],
            ['nombre' => 'Diego Campos', 'email' => 'dcampos@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Secretaria')],

            // Profesionales Legales
            ['nombre' => 'Sofía Orozco', 'email' => 'sorozco@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Profesional')],
            ['nombre' => 'Gabriel Torrez', 'email' => 'gtorrez@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Profesional')],

            // Jefes Legales
            ['nombre' => 'Elena Paredes', 'email' => 'eparedes@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Jefe de Área')],
            ['nombre' => 'Hugo Salinas', 'email' => 'hsalinas@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Jefe de Área')],

            // Personal adicional en Secretaria Administrativa
            ['nombre' => 'Carmen Delgado', 'email' => 'cdelgado@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Secretaria')],
            ['nombre' => 'Luis Suárez', 'email' => 'lsuarez@ejemplo.gob.bo', 'puesto_id' => $puestoAdmin('Secretaria')],

            // Personal adicional en Secretaria Legal
            ['nombre' => 'Patricia Nava', 'email' => 'pnava@ejemplo.gob.bo', 'puesto_id' => $puestoLegal('Secretaria')],
        ];

        foreach ($funcionarios as $funcionario) {
            Funcionario::create($funcionario);
        }
    }
}
