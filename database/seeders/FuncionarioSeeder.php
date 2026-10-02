<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Funcionario;
use App\Models\Puesto;
use App\Models\User;
use Illuminate\Database\Seeder;

class FuncionarioSeeder extends Seeder
{
    public function run(): void
    {
        $areaDla = Area::where('sigla', 'DLA')->firstOrFail();
        $puestosDla = Puesto::where('area_id', $areaDla->id)->orderBy('id')->get();
        $admin = User::where('email', 'admin@seguimiento.gob.bo')->first();

        $funcionarios = [
            ['nombre' => 'Carlos', 'apellidos' => 'Mendoza López', 'email' => 'cmendoza@ejemplo.gob.bo', 'nro_telefono' => '71234567', 'cedula_identidad' => '1234567', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaDla->id],
            ['nombre' => 'Rosa', 'apellidos' => 'Quispe Mamani', 'email' => 'rquispe@ejemplo.gob.bo', 'nro_telefono' => '71234568', 'cedula_identidad' => '1234568', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Ana', 'apellidos' => 'Vargas Flores', 'email' => 'avargas@ejemplo.gob.bo', 'nro_telefono' => '71234569', 'cedula_identidad' => '1234569', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Pedro', 'apellidos' => 'Mamani Choque', 'email' => 'pmamani@ejemplo.gob.bo', 'nro_telefono' => '71234570', 'cedula_identidad' => '1234570', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Lucía', 'apellidos' => 'Flores Ríos', 'email' => 'lflores@ejemplo.gob.bo', 'nro_telefono' => '71234571', 'cedula_identidad' => '1234571', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaDla->id],
            ['nombre' => 'Jorge', 'apellidos' => 'Ríos García', 'email' => 'jrios@ejemplo.gob.bo', 'nro_telefono' => '71234572', 'cedula_identidad' => '1234572', 'tipo_funcionario' => 'contrato', 'nivel' => 'Jefe', 'area_id' => $areaDla->id],
            ['nombre' => 'María', 'apellidos' => 'Luna Rivas', 'email' => 'mluna@ejemplo.gob.bo', 'nro_telefono' => '71234573', 'cedula_identidad' => '1234573', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Diego', 'apellidos' => 'Campos Vega', 'email' => 'dcampos@ejemplo.gob.bo', 'nro_telefono' => '71234574', 'cedula_identidad' => '1234574', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Sofía', 'apellidos' => 'Orozco Pinto', 'email' => 'sorozco@ejemplo.gob.bo', 'nro_telefono' => '71234575', 'cedula_identidad' => '1234575', 'tipo_funcionario' => 'item', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Gabriel', 'apellidos' => 'Torrez Durán', 'email' => 'gtorrez@ejemplo.gob.bo', 'nro_telefono' => '71234576', 'cedula_identidad' => '1234576', 'tipo_funcionario' => 'contrato', 'nivel' => 'Profesional', 'area_id' => $areaDla->id],
            ['nombre' => 'Elena', 'apellidos' => 'Paredes Ávila', 'email' => 'eparedes@ejemplo.gob.bo', 'nro_telefono' => '71234577', 'cedula_identidad' => '1234577', 'tipo_funcionario' => 'item', 'nivel' => 'Jefe', 'area_id' => $areaDla->id],
            ['nombre' => 'Hugo', 'apellidos' => 'Salinas Medina', 'email' => 'hsalinas@ejemplo.gob.bo', 'nro_telefono' => '71234578', 'cedula_identidad' => '1234578', 'tipo_funcionario' => 'contrato', 'nivel' => 'Jefe', 'area_id' => $areaDla->id],
            ['nombre' => 'Carmen', 'apellidos' => 'Delgado Herrera', 'email' => 'cdelgado@ejemplo.gob.bo', 'nro_telefono' => '71234579', 'cedula_identidad' => '1234579', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaDla->id],
            ['nombre' => 'Luis', 'apellidos' => 'Suárez Cortez', 'email' => 'lsuarez@ejemplo.gob.bo', 'nro_telefono' => '71234580', 'cedula_identidad' => '1234580', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaDla->id],
            ['nombre' => 'Patricia', 'apellidos' => 'Nava Zambrana', 'email' => 'pnava@ejemplo.gob.bo', 'nro_telefono' => '71234581', 'cedula_identidad' => '1234581', 'tipo_funcionario' => 'contrato', 'nivel' => 'Asistente', 'area_id' => $areaDla->id],
        ];

        foreach ($funcionarios as $i => $data) {
            if ($admin && in_array($data['nombre'], ['Carlos', 'Rosa', 'Ana', 'Pedro'])) {
                $data['creado_por'] = $admin->id;
            }
            $data['puesto_id'] = $puestosDla[$i % $puestosDla->count()]->id;
            Funcionario::create($data);
        }
    }
}
