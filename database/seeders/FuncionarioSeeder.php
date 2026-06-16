<?php

namespace Database\Seeders;

use App\Models\Funcionario;
use Illuminate\Database\Seeder;

class FuncionarioSeeder extends Seeder
{
    public function run(): void
    {
        $funcionarios = [
            // Mesa de Partes (puesto_id = 7)
            ['nombre' => 'Carlos Mendoza', 'email' => 'cmendoza@ejemplo.gob.bo', 'puesto_id' => 7],
            ['nombre' => 'Rosa Quispe', 'email' => 'rquispe@ejemplo.gob.bo', 'puesto_id' => 7],

            // Secretaría General (puesto_id = 1)
            ['nombre' => 'Ana Vargas', 'email' => 'avargas@ejemplo.gob.bo', 'puesto_id' => 1],
            ['nombre' => 'Pedro Mamani', 'email' => 'pmamani@ejemplo.gob.bo', 'puesto_id' => 1],

            // Recursos Humanos (puesto_id = 2)
            ['nombre' => 'Lucía Flores', 'email' => 'lflores@ejemplo.gob.bo', 'puesto_id' => 2],
            ['nombre' => 'Jorge Ríos', 'email' => 'jrios@ejemplo.gob.bo', 'puesto_id' => 2],

            // Dirección Financiera (puesto_id = 3)
            ['nombre' => 'María Luna', 'email' => 'mluna@ejemplo.gob.bo', 'puesto_id' => 3],
            ['nombre' => 'Diego Campos', 'email' => 'dcampos@ejemplo.gob.bo', 'puesto_id' => 3],

            // Asesoría Jurídica (puesto_id = 4)
            ['nombre' => 'Sofía Orozco', 'email' => 'sorozco@ejemplo.gob.bo', 'puesto_id' => 4],
            ['nombre' => 'Gabriel Torrez', 'email' => 'gtorrez@ejemplo.gob.bo', 'puesto_id' => 4],

            // Fiscalización (puesto_id = 5)
            ['nombre' => 'Elena Paredes', 'email' => 'eparedes@ejemplo.gob.bo', 'puesto_id' => 5],
            ['nombre' => 'Hugo Salinas', 'email' => 'hsalinas@ejemplo.gob.bo', 'puesto_id' => 5],

            // Departamento Técnico (puesto_id = 6)
            ['nombre' => 'Carmen Delgado', 'email' => 'cdelgado@ejemplo.gob.bo', 'puesto_id' => 6],
            ['nombre' => 'Luis Suárez', 'email' => 'lsuarez@ejemplo.gob.bo', 'puesto_id' => 6],

            // Archivo Central (puesto_id = 8)
            ['nombre' => 'Patricia Nava', 'email' => 'pnava@ejemplo.gob.bo', 'puesto_id' => 8],
        ];

        foreach ($funcionarios as $funcionario) {
            Funcionario::create($funcionario);
        }
    }
}
