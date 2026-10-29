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
 * Siembra los usuarios institucionales del sistema.
 *
 * Es idempotente: puede ejecutarse tantas veces como se quiera sobre una base
 * ya sembrada sin duplicar personas, puestos vigentes ni áreas habilitadas.
 *
 * Requiere que AreaSeeder y RolesYPermisosSeeder hayan corrido antes.
 */
class UsuarioSeeder extends Seeder
{
    /**
     * Contraseña común de las cuentas sembradas (cumple el min:5 de los Form Requests).
     */
    public const PASSWORD = '1234567';

    /**
     * Usuarios que debe tener el sistema.
     *
     * @var list<array{
     *     username: string,
     *     nombres: string,
     *     apellidos: string,
     *     ci: string,
     *     area: string,
     *     puesto: string,
     *     rol: string,
     *     areas_habilitadas: list<string>,
     *     area_predeterminada: string
     * }>
     */
    private const USUARIOS = [
        [
            'username' => 'amontoya',
            'nombres' => 'Alfredo',
            'apellidos' => 'Montoya Calderón',
            'ci' => '2000001',
            'area' => 'SEMPLA',
            'puesto' => 'JEFE',
            'rol' => 'admin',
            'areas_habilitadas' => ['SEMPLA'],
            'area_predeterminada' => 'SEMPLA',
        ],
        [
            'username' => 'cpizarroso',
            'nombres' => 'Cristian Marcelo',
            'apellidos' => 'Pizarroso Peredo',
            'ci' => '2000002',
            'area' => 'SEMPLA',
            'puesto' => 'PROFESIONAL',
            'rol' => 'admin',
            'areas_habilitadas' => ['SEMPLA'],
            'area_predeterminada' => 'SEMPLA',
        ],
        [
            'username' => 'erodriguez',
            'nombres' => 'Erika',
            'apellidos' => 'Rodriguez',
            'ci' => '1234567',
            'area' => 'DLA',
            'puesto' => 'SECRETARIA',
            'rol' => 'secretaria',
            'areas_habilitadas' => ['LEG', 'ADM'],
            'area_predeterminada' => 'LEG',
        ],
        [
            'username' => 'mfcastillo',
            'nombres' => 'Mauricio Federico',
            'apellidos' => 'Castillo Otero',
            'ci' => '8165704',
            'area' => 'ADM',
            'puesto' => 'PROFESIONAL',
            'rol' => 'user',
            'areas_habilitadas' => ['ADM'],
            'area_predeterminada' => 'ADM',
        ],
        [
            'username' => 'guantelo',
            'nombres' => 'Gustavo',
            'apellidos' => 'Antelo Rivero',
            'ci' => '7716052',
            'area' => 'ADM',
            'puesto' => 'PROFESIONAL',
            'rol' => 'user',
            'areas_habilitadas' => ['ADM'],
            'area_predeterminada' => 'ADM',
        ],
        [
            'username' => 'motero',
            'nombres' => 'Monica',
            'apellidos' => 'Otero Melgar',
            'ci' => '6242130',
            'area' => 'ADM',
            'puesto' => 'ASISTENTE',
            'rol' => 'user',
            'areas_habilitadas' => ['ADM'],
            'area_predeterminada' => 'ADM',
        ],
        [
            'username' => 'cyescudero',
            'nombres' => 'Carol Yasmil',
            'apellidos' => 'Escudero Mariscal',
            'ci' => '3934678',
            'area' => 'SEMPLA',
            'puesto' => 'ASISTENTE',
            'rol' => 'secretaria',
            'areas_habilitadas' => ['SEMPLA'],
            'area_predeterminada' => 'SEMPLA',
        ],
    ];

    public function run(): void
    {
        $dominio = (string) config('app.user_domain');

        foreach (self::USUARIOS as $data) {
            DB::transaction(function () use ($data, $dominio): void {
                $email = $data['username'].'@'.$dominio;

                $persona = $this->resolverPersona($data, $email);

                $this->asignarPuesto($persona, $data['area'], $data['puesto']);

                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'username' => $data['username'],
                        'password' => self::PASSWORD,
                        'persona_id' => $persona->id,
                        'activo' => true,
                    ]
                );

                $this->asignarRol($user, $data['rol']);

                $this->sincronizarAreasHabilitadas(
                    $user,
                    $data['areas_habilitadas'],
                    $data['area_predeterminada'],
                );
            });
        }
    }

    /**
     * @param  array{nombres: string, apellidos: string, ci: string}  $data
     */
    private function resolverPersona(array $data, string $email): Persona
    {
        return Persona::updateOrCreate(
            ['ci' => $data['ci']],
            [
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'correo' => $email,
                'activo' => true,
            ]
        );
    }

    private function asignarPuesto(Persona $persona, string $areaCodigo, string $puestoNombre): void
    {
        $areaId = Area::where('codigo', $areaCodigo)->value('id');

        if ($areaId === null) {
            throw new RuntimeException(
                "No existe el área {$areaCodigo}. Ejecuta AreaSeeder antes que UsuarioSeeder."
            );
        }

        $puesto = Puesto::where('area_id', $areaId)
            ->where('nombre', $puestoNombre)
            ->first();

        if ($puesto === null) {
            throw new RuntimeException(
                "No existe el puesto {$puestoNombre} en el área {$areaCodigo}."
            );
        }

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

    private function asignarRol(User $user, string $slug): void
    {
        $rolId = Rol::where('slug', $slug)->value('id');

        if ($rolId === null) {
            throw new RuntimeException(
                "No existe el rol {$slug}. Ejecuta RolesYPermisosSeeder antes que UsuarioSeeder."
            );
        }

        $user->roles()->sync([$rolId]);
    }

    /**
     * @param  list<string>  $codigos
     */
    private function sincronizarAreasHabilitadas(User $user, array $codigos, string $predeterminada): void
    {
        $ids = Area::whereIn('codigo', $codigos)->pluck('id', 'codigo');

        $sync = [];
        foreach ($codigos as $codigo) {
            $areaId = $ids->get($codigo);

            if ($areaId === null) {
                throw new RuntimeException(
                    "No existe el área {$codigo}. Ejecuta AreaSeeder antes que UsuarioSeeder."
                );
            }

            $sync[$areaId] = ['predeterminada' => false];
        }

        // Primero se quitan todas las predeterminadas para no romper el índice único.
        $user->areasHabilitadas()->sync($sync);

        $predeterminadaId = $ids->get($predeterminada);

        if ($predeterminadaId !== null) {
            $user->areasHabilitadas()->updateExistingPivot($predeterminadaId, ['predeterminada' => true]);
        }
    }
}
