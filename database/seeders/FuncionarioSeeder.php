<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Funcionario;
use Illuminate\Database\Seeder;

class FuncionarioSeeder extends Seeder
{
    public function run(): void
    {
        $areaAdm = Area::where('sigla', 'ADM')->first()->id;
        $areaLegal = Area::where('sigla', 'LEG')->first()->id;
        $areaRrpp = Area::where('sigla', 'RRHH')->first()->id;

        $funcionarios = [
            ['nombre' => 'Carlos', 'apellidos' => 'Mendoza López', 'email' => 'cmendoza@ejemplo.gob.bo', 'nro_telefono' => '71234567', 'cedula_identidad' => '1234567', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaAdm],
            ['nombre' => 'Rosa', 'apellidos' => 'Quispe Mamani', 'email' => 'rquispe@ejemplo.gob.bo', 'nro_telefono' => '71234568', 'cedula_identidad' => '1234568', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaAdm],
            ['nombre' => 'Ana', 'apellidos' => 'Vargas Flores', 'email' => 'avargas@ejemplo.gob.bo', 'nro_telefono' => '71234569', 'cedula_identidad' => '1234569', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaAdm],
            ['nombre' => 'Pedro', 'apellidos' => 'Mamani Choque', 'email' => 'pmamani@ejemplo.gob.bo', 'nro_telefono' => '71234570', 'cedula_identidad' => '1234570', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaAdm],
            ['nombre' => 'Lucía', 'apellidos' => 'Flores Ríos', 'email' => 'lflores@ejemplo.gob.bo', 'nro_telefono' => '71234571', 'cedula_identidad' => '1234571', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaAdm],
            ['nombre' => 'Jorge', 'apellidos' => 'Ríos García', 'email' => 'jrios@ejemplo.gob.bo', 'nro_telefono' => '71234572', 'cedula_identidad' => '1234572', 'tipo_funcionario' => 'contrato', 'nivel' => 'Jefe', 'area_id' => $areaAdm],
            ['nombre' => 'María', 'apellidos' => 'Luna Rivas', 'email' => 'mluna@ejemplo.gob.bo', 'nro_telefono' => '71234573', 'cedula_identidad' => '1234573', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaLegal],
            ['nombre' => 'Diego', 'apellidos' => 'Campos Vega', 'email' => 'dcampos@ejemplo.gob.bo', 'nro_telefono' => '71234574', 'cedula_identidad' => '1234574', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaLegal],
            ['nombre' => 'Sofía', 'apellidos' => 'Orozco Pinto', 'email' => 'sorozco@ejemplo.gob.bo', 'nro_telefono' => '71234575', 'cedula_identidad' => '1234575', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaLegal],
            ['nombre' => 'Gabriel', 'apellidos' => 'Torrez Durán', 'email' => 'gtorrez@ejemplo.gob.bo', 'nro_telefono' => '71234576', 'cedula_identidad' => '1234576', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaLegal],
            ['nombre' => 'Elena', 'apellidos' => 'Paredes Ávila', 'email' => 'eparedes@ejemplo.gob.bo', 'nro_telefono' => '71234577', 'cedula_identidad' => '1234577', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaLegal],
            ['nombre' => 'Hugo', 'apellidos' => 'Salinas Medina', 'email' => 'hsalinas@ejemplo.gob.bo', 'nro_telefono' => '71234578', 'cedula_identidad' => '1234578', 'tipo_funcionario' => 'contrato', 'nivel' => 'Jefe', 'area_id' => $areaLegal],
            ['nombre' => 'Carmen', 'apellidos' => 'Delgado Herrera', 'email' => 'cdelgado@ejemplo.gob.bo', 'nro_telefono' => '71234579', 'cedula_identidad' => '1234579', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaAdm],
            ['nombre' => 'Luis', 'apellidos' => 'Suárez Cortez', 'email' => 'lsuarez@ejemplo.gob.bo', 'nro_telefono' => '71234580', 'cedula_identidad' => '1234580', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaAdm],
            ['nombre' => 'Patricia', 'apellidos' => 'Nava Zambrana', 'email' => 'pnava@ejemplo.gob.bo', 'nro_telefono' => '71234581', 'cedula_identidad' => '1234581', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaLegal],
        ];

        foreach ($funcionarios as $funcionario) {
            Funcionario::create($funcionario);
        }
    }
}
