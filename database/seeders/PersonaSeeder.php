<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use Illuminate\Database\Seeder;

class PersonaSeeder extends Seeder
{
    public function run(): void
    {
        $dla = Area::where('codigo', 'DLA')->firstOrFail();
        $puestos = Puesto::where('area_id', $dla->id)->get()->keyBy('nombre');

        $personas = [
            ['nombres' => 'Carlos', 'apellidos' => 'Mendoza López', 'ci' => '1000001', 'correo' => 'cmendoza@ejemplo.gob.bo', 'puesto' => 'JEFE'],
            ['nombres' => 'Rosa', 'apellidos' => 'Quispe Mamani', 'ci' => '1000002', 'correo' => 'rquispe@ejemplo.gob.bo', 'puesto' => 'PROFESIONAL'],
            ['nombres' => 'Ana', 'apellidos' => 'Vargas Flores', 'ci' => '1000003', 'correo' => 'avargas@ejemplo.gob.bo', 'puesto' => 'PROFESIONAL'],
            ['nombres' => 'Luis', 'apellidos' => 'Torrez Rojas', 'ci' => '1000004', 'correo' => 'ltorrez@ejemplo.gob.bo', 'puesto' => 'PROFESIONAL'],
            ['nombres' => 'María', 'apellidos' => 'Limachi Quispe', 'ci' => '1000005', 'correo' => 'mlimachi@ejemplo.gob.bo', 'puesto' => 'PROFESIONAL'],
            ['nombres' => 'Erika', 'apellidos' => 'Rodriguez', 'ci' => '1234567', 'correo' => 'erodriguez@'.config('app.user_domain'), 'puesto' => 'SECRETARIA'],
        ];

        foreach ($personas as $data) {
            $persona = Persona::updateOrCreate(
                ['ci' => $data['ci']],
                [
                    'nombres' => $data['nombres'],
                    'apellidos' => $data['apellidos'],
                    'telefono' => null,
                    'correo' => $data['correo'],
                    'direccion' => null,
                    'activo' => true,
                ]
            );

            $puesto = $puestos->get($data['puesto']);

            if ($puesto) {
                $this->asignarPuesto($persona, $puesto);
            }
        }
    }

    private function asignarPuesto(Persona $persona, Puesto $puesto): void
    {
        $vigente = $persona->puestoActivo()->first();

        if ($vigente && $vigente->puesto_id === $puesto->id) {
            return;
        }

        if ($vigente) {
            $vigente->update(['fecha_fin' => now()->subDay()->toDateString()]);
        }

        PersonaPuesto::create([
            'persona_id' => $persona->id,
            'puesto_id' => $puesto->id,
            'fecha_inicio' => now()->toDateString(),
            'fecha_fin' => null,
        ]);
    }
}
