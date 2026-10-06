<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Derivacion;
use App\Models\Tramite;
use App\Models\User;
use App\Services\ContadorTramiteService;
use Database\Factories\DerivacionFactory;
use Illuminate\Database\Seeder;

class TramiteSeeder extends Seeder
{
    private string $fechaBase;

    private int $year;

    private array $usuarios;

    public function run(): void
    {
        $this->fechaBase = now()->subMonths(6)->format('Y-m-d');
        $this->year = now()->year;
        $this->usuarios = User::all()->keyBy('id')->toArray();

        $areaIds = Area::pluck('id')->toArray();

        $tramites = [
            ['year' => 2025, 'fecha' => '2025-01-10', 'estado' => 'finalizado'],
            ['year' => 2025, 'fecha' => '2025-01-15', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-01-03', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-01-08', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-01-12', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-01-18', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-01-22', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-01-28', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-02-02', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-02-05', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-02-10', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-02-14', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-02-19', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-02-25', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-03-01', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-03-04', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-03-08', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-03-12', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-03-18', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-03-22', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-03-28', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-04-01', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-04-05', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-04-09', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-04-15', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-04-20', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-04-25', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-04-30', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-05-04', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-05-07', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-05-12', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-05-16', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-05-20', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-05-25', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-05-28', 'estado' => 'finalizado'],
            ['year' => 2026, 'fecha' => '2026-06-01', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-06-03', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-06-05', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-06-08', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-06-10', 'estado' => 'proceso'],
            ['year' => 2026, 'fecha' => '2026-06-12', 'estado' => 'iniciado'],
            ['year' => 2026, 'fecha' => '2026-06-12', 'estado' => 'iniciado'],
        ];

        $areaIds = Area::pluck('id')->toArray();

        // Fase 1: trámites iniciales (históricos).
        foreach ($tramites as $t) {
            $this->crearTramite($t, $areaIds);
        }

        // Fase 2: trámites de hoy, después de los iniciales.
        foreach ($this->tramitesDeHoy() as $t) {
            $this->crearTramite($t, $areaIds);
        }

        // Fase 3: 50 trámites de hoy para erodriguez (reporte).
        // UserSecretariaSeeder corre antes, pero se protege el seed parcial.
        $erodriguez = User::where('email', 'erodriguez@'.config('app.user_domain'))->first();
        if ($erodriguez !== null) {
            $this->crearParaUsuario($erodriguez, 50);
        }
    }

    /**
     * Crea $cantidad trámites con fecha de hoy para un usuario dado.
     * Útil para probar el reporte de trámites ingresados.
     *
     * @param  User|string|int  $usuario  Modelo, id, email o login (sin dominio).
     */
    public function crearParaUsuario(User|string|int $usuario, int $cantidad = 50): void
    {
        $user = $this->resolverUsuario($usuario);

        $areaId = $user->funcionario?->area_id
            ?? $user->puestoActivo?->puesto?->area_id
            ?? Area::where('sigla', 'DLA')->value('id')
            ?? Area::orderBy('id')->value('id');

        if ($areaId === null) {
            throw new \RuntimeException('Sin áreas para asignar los trámites del seed.');
        }

        $hoy = now()->format('Y-m-d');
        $year = now()->year;

        $estados = [
            'iniciado', 'proceso', 'proceso', 'iniciado', 'proceso',
            'observado', 'proceso', 'iniciado', 'proceso', 'proceso',
            'finalizado', 'proceso', 'iniciado', 'proceso', 'observado',
        ];

        // Horarios escalonados entre 08:00 y 18:00.
        for ($i = 0; $i < $cantidad; $i++) {
            $minutos = (int) round($i * 600 / max($cantidad, 1));
            $hora = sprintf('%02d:%02d:00', 8 + intdiv($minutos, 60), $minutos % 60);

            $this->crearTramite([
                'year' => $year,
                'fecha' => $hoy,
                'hora' => $hora,
                'estado' => $estados[$i % count($estados)],
                'area_id' => $areaId,
            ], [$areaId], $user);
        }
    }

    private function resolverUsuario(User|string|int $usuario): User
    {
        if ($usuario instanceof User) {
            return $usuario;
        }

        if (is_int($usuario)) {
            return User::findOrFail($usuario);
        }

        $email = str_contains($usuario, '@')
            ? $usuario
            : $usuario.'@'.config('app.user_domain');

        return User::where('email', $email)->firstOrFail();
    }

    private function crearTramite(array $t, array $areaIds, ?User $usuarioFijo = null): Tramite
    {
        $contador = app(ContadorTramiteService::class);

        // El área puede venir forzada (ej. trámites de hoy) o del usuario.
        $areaId = $t['area_id']
            ?? (isset($t['area_sigla'])
                ? Area::where('sigla', $t['area_sigla'])->firstOrFail()->id
                : null);

        // Usuario fijo (ej. seed por usuario) o aleatorio: de él salen
        // área, creador y primera derivación.
        $usuario = $usuarioFijo ?? User::inRandomOrder()->firstOrFail();
        $areaId ??= $usuario->funcionario?->area_id
            ?? $usuario->puestoActivo?->puesto?->area_id
            ?? $areaIds[array_rand($areaIds)];

        // Numeración con la misma lógica de la aplicación.
        $numero = $contador->siguienteNumero($areaId, $t['year']);

        // Datos variables (descripción, urgente, etc.) desde el factory.
        // created_at usa la fecha del arreglo, no el momento del seed.
        $tramite = Tramite::factory()->create([
            'numero_tramite' => $numero,
            'numero_completo' => Tramite::generarNumeroCompleto($areaId, $numero, $t['year']),
            'year' => $t['year'],
            'fecha' => $t['fecha'].' '.($t['hora'] ?? '08:00:00'),
            'estado' => $t['estado'],
            'area_id' => $areaId,
            'creado_por' => $usuario->id,
            'derivado_a' => null,
            'ultima_respuesta' => null,
            'created_at' => $t['fecha'].' '.($t['hora'] ?? '08:00:00'),
        ]);

        $tramite->crearPrimeraDerivacion();
        $this->crearDerivaciones($tramite);

        return $tramite;
    }

    /**
     * 15 trámites con fecha de hoy en distintos horarios.
     */
    private function tramitesDeHoy(): array
    {
        $hoy = now()->format('Y-m-d');
        $year = now()->year;

        $horas = [
            '08:00:00', '08:30:00', '09:00:00', '09:30:00', '10:00:00',
            '10:30:00', '11:00:00', '11:30:00', '12:00:00', '13:00:00',
            '14:00:00', '15:00:00', '16:00:00', '17:00:00', '17:30:00',
        ];

        $estados = [
            'iniciado', 'proceso', 'proceso', 'iniciado', 'proceso',
            'observado', 'proceso', 'iniciado', 'proceso', 'proceso',
            'finalizado', 'proceso', 'iniciado', 'proceso', 'observado',
        ];

        $tramites = [];
        foreach ($horas as $i => $hora) {
            $tramites[] = [
                'year' => $year,
                'fecha' => $hoy,
                'hora' => $hora,
                'estado' => $estados[$i],
                'area_sigla' => 'DLA',
            ];
        }

        return $tramites;
    }

    private function crearDerivaciones(Tramite $tramite): void
    {
        $numDerivaciones = random_int(9, 19);

        DerivacionFactory::new()->crearCadena($tramite, $numDerivaciones);

        $ultima = Derivacion::where('tramite_id', $tramite->id)
            ->orderBy('numero_derivacion', 'desc')
            ->first();

        if ($ultima) {
            $tramite->updateQuietly([
                'derivado_a' => $ultima->derivado_a,
                'ultima_respuesta' => $ultima->glosa_derivacion,
            ]);
        }
    }
}
