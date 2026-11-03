<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Persona;
use App\Models\PersonaPuesto;
use App\Models\Puesto;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Crea el usuario técnico que recibe las derivaciones importadas desde la
 * planilla de DOCUMENTOS RECIB DLA (no se conoce el destinatario real).
 *
 * Es idempotente y puede ejecutarse sobre una base en producción.
 */
class UsuarioImportacionSeeder extends Seeder
{
    public const USERNAME = 'importacion';

    public const PASSWORD = '1234567';

    public const AREA = 'COM';

    public const PUESTO = 'PROFESIONAL';

    public const ROL = 'user';

    public function run(): void
    {
        DB::transaction(function (): void {
            $area = Area::where('codigo', self::AREA)->first();

            if ($area === null) {
                throw new RuntimeException(
                    'No existe el área '.self::AREA.'. Ejecuta AreaSeeder antes que UsuarioImportacionSeeder.'
                );
            }

            $puesto = Puesto::where('area_id', $area->id)
                ->where('nombre', self::PUESTO)
                ->first();

            if ($puesto === null) {
                throw new RuntimeException(
                    'No existe el puesto '.self::PUESTO.' en el área '.self::AREA.'.'
                );
            }

            $email = self::USERNAME.'@'.config('app.user_domain');

            $persona = Persona::updateOrCreate(
                ['ci' => '9000001'],
                [
                    'nombres' => 'Usuario',
                    'apellidos' => 'Importación',
                    'correo' => $email,
                    'activo' => true,
                ]
            );

            $this->asignarPuesto($persona, $puesto);

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'username' => self::USERNAME,
                    'password' => self::PASSWORD,
                    'persona_id' => $persona->id,
                    'activo' => true,
                ]
            );

            $rolId = Rol::where('slug', self::ROL)->value('id');

            if ($rolId === null) {
                throw new RuntimeException(
                    'No existe el rol '.self::ROL.'. Ejecuta RolesYPermisosSeeder primero.'
                );
            }

            $user->roles()->sync([$rolId]);
            $user->areasHabilitadas()->sync([$area->id => ['predeterminada' => true]]);
        });
    }

    private function asignarPuesto(Persona $persona, Puesto $puesto): void
    {
        $vigente = $persona->puestoActivo()->first();

        if ($vigente !== null && $vigente->puesto_id === $puesto->id) {
            return;
        }

        if ($vigente !== null) {
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
