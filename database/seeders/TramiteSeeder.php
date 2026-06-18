<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Tramite;
use App\Models\User;
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
            ['num' => 1, 'year' => 2025, 'fecha' => '2025-01-10', 'descripcion' => 'Solicitud de permiso de construcción para edificio comercial', 'estado' => 'finalizado'],
            ['num' => 2, 'year' => 2025, 'fecha' => '2025-01-15', 'descripcion' => 'Registro de marca comercial "Andina Foods"', 'estado' => 'proceso'],
            ['num' => 1, 'year' => 2026, 'fecha' => '2026-01-03', 'descripcion' => 'Licencia de funcionamiento para farmacia central', 'estado' => 'iniciado'],
            ['num' => 2, 'year' => 2026, 'fecha' => '2026-01-08', 'descripcion' => 'Certificado de antecedentes penales para Lic. Martínez', 'estado' => 'proceso'],
            ['num' => 3, 'year' => 2026, 'fecha' => '2026-01-12', 'descripcion' => 'Solicitud de beca educativa municipal 2026', 'estado' => 'proceso'],
            ['num' => 4, 'year' => 2026, 'fecha' => '2026-01-18', 'descripcion' => 'Permiso ambiental para planta recicladora', 'estado' => 'finalizado'],
            ['num' => 5, 'year' => 2026, 'fecha' => '2026-01-22', 'descripcion' => 'Solicitud de cambio de zonificación para terreno urbano', 'estado' => 'proceso'],
            ['num' => 6, 'year' => 2026, 'fecha' => '2026-01-28', 'descripcion' => 'Registro sanitario de producto alimenticio "NutriSalud"', 'estado' => 'iniciado'],
            ['num' => 7, 'year' => 2026, 'fecha' => '2026-02-02', 'descripcion' => 'Solicitud de conexión de agua potable para urbanización', 'estado' => 'proceso'],
            ['num' => 8, 'year' => 2026, 'fecha' => '2026-02-05', 'descripcion' => 'Trámite de sucesión hereditaria familia Rojas', 'estado' => 'finalizado'],
            ['num' => 9, 'year' => 2026, 'fecha' => '2026-02-10', 'descripcion' => 'Solicitud de subsidio habitacional para vivienda social', 'estado' => 'proceso'],
            ['num' => 10, 'year' => 2026, 'fecha' => '2026-02-14', 'descripcion' => 'Legalización de documentos académicos extranjeros', 'estado' => 'iniciado'],
            ['num' => 11, 'year' => 2026, 'fecha' => '2026-02-19', 'descripcion' => 'Permiso de importación de equipos médicos', 'estado' => 'proceso'],
            ['num' => 12, 'year' => 2026, 'fecha' => '2026-02-25', 'descripcion' => 'Registro de propiedad intelectual de software educativo', 'estado' => 'proceso'],
            ['num' => 13, 'year' => 2026, 'fecha' => '2026-03-01', 'descripcion' => 'Solicitud de pensión alimenticia - caso 45/2026', 'estado' => 'iniciado'],
            ['num' => 14, 'year' => 2026, 'fecha' => '2026-03-04', 'descripcion' => 'Trámite de naturalización para ciudadano extranjero', 'estado' => 'finalizado'],
            ['num' => 15, 'year' => 2026, 'fecha' => '2026-03-08', 'descripcion' => 'Renovación de licencia de conducir profesional', 'estado' => 'finalizado'],
            ['num' => 16, 'year' => 2026, 'fecha' => '2026-03-12', 'descripcion' => 'Solicitud de catastro para predio rural', 'estado' => 'proceso'],
            ['num' => 17, 'year' => 2026, 'fecha' => '2026-03-18', 'descripcion' => 'Permiso de demolición de inmueble patrimonial', 'estado' => 'iniciado'],
            ['num' => 18, 'year' => 2026, 'fecha' => '2026-03-22', 'descripcion' => 'Afiliación al sistema de salud municipal', 'estado' => 'proceso'],
            ['num' => 19, 'year' => 2026, 'fecha' => '2026-03-28', 'descripcion' => 'Solicitud de permiso para evento público masivo', 'estado' => 'proceso'],
            ['num' => 20, 'year' => 2026, 'fecha' => '2026-04-01', 'descripcion' => 'Registro de unión libre para beneficios sociales', 'estado' => 'finalizado'],
            ['num' => 21, 'year' => 2026, 'fecha' => '2026-04-05', 'descripcion' => 'Certificado de defunción para trámite sucesorio', 'estado' => 'finalizado'],
            ['num' => 22, 'year' => 2026, 'fecha' => '2026-04-09', 'descripcion' => 'Solicitud de crédito hipotecario para vivienda', 'estado' => 'iniciado'],
            ['num' => 23, 'year' => 2026, 'fecha' => '2026-04-15', 'descripcion' => 'Permiso de exportación de productos textiles', 'estado' => 'proceso'],
            ['num' => 24, 'year' => 2026, 'fecha' => '2026-04-20', 'descripcion' => 'Solicitud de visa de trabajo para técnico especializado', 'estado' => 'proceso'],
            ['num' => 25, 'year' => 2026, 'fecha' => '2026-04-25', 'descripcion' => 'Registro de obra intelectual - novela histórica', 'estado' => 'iniciado'],
            ['num' => 26, 'year' => 2026, 'fecha' => '2026-04-30', 'descripcion' => 'Cambio de nombre por identidad de género', 'estado' => 'finalizado'],
            ['num' => 27, 'year' => 2026, 'fecha' => '2026-05-04', 'descripcion' => 'Solicitud de asilo político', 'estado' => 'proceso'],
            ['num' => 28, 'year' => 2026, 'fecha' => '2026-05-07', 'descripcion' => 'Registro de función de teatro comunitario', 'estado' => 'proceso'],
            ['num' => 29, 'year' => 2026, 'fecha' => '2026-05-12', 'descripcion' => 'Trámite aduanero para importación de maquinaria', 'estado' => 'iniciado'],
            ['num' => 30, 'year' => 2026, 'fecha' => '2026-05-16', 'descripcion' => 'Permiso de construcción de vivienda unifamiliar', 'estado' => 'proceso'],
            ['num' => 31, 'year' => 2026, 'fecha' => '2026-05-20', 'descripcion' => 'Solicitud de beca deportiva municipal', 'estado' => 'iniciado'],
            ['num' => 32, 'year' => 2026, 'fecha' => '2026-05-25', 'descripcion' => 'Certificado de origen para exportación de quinua', 'estado' => 'finalizado'],
            ['num' => 33, 'year' => 2026, 'fecha' => '2026-05-28', 'descripcion' => 'Registro de vehículo automotor importado', 'estado' => 'finalizado'],
            ['num' => 34, 'year' => 2026, 'fecha' => '2026-06-01', 'descripcion' => 'Solicitud de reconocimiento de firma para poder notarial', 'estado' => 'iniciado'],
            ['num' => 35, 'year' => 2026, 'fecha' => '2026-06-03', 'descripcion' => 'Permiso ambiental para proyecto minero', 'estado' => 'proceso'],
            ['num' => 36, 'year' => 2026, 'fecha' => '2026-06-05', 'descripcion' => 'Solicitud de jubilación para funcionario público', 'estado' => 'proceso'],
            ['num' => 37, 'year' => 2026, 'fecha' => '2026-06-08', 'descripcion' => 'Trámite de pasaporte por primera vez', 'estado' => 'iniciado'],
            ['num' => 38, 'year' => 2026, 'fecha' => '2026-06-10', 'descripcion' => 'Cambio de domicilio fiscal para empresa constructora', 'estado' => 'proceso'],
            ['num' => 39, 'year' => 2026, 'fecha' => '2026-06-12', 'descripcion' => 'Inscripción al padrón electoral municipal', 'estado' => 'iniciado'],
            ['num' => 40, 'year' => 2026, 'fecha' => '2026-06-12', 'descripcion' => 'Solicitud de subsidio habitacional rural', 'estado' => 'iniciado'],
        ];

        $usuarioIds = User::pluck('id')->toArray();

        $siguienteNumero = [];
        foreach ($tramites as $t) {
            $key = $t['year'] . '-' . $areaIds[0];
            $siguienteNumero[$key] ??= Tramite::where('year', $t['year'])
                ->where('area_id', $areaIds[0])
                ->max('numero_tramite') ?? 0;
        }
        unset($key);

        foreach ($tramites as $i => $t) {
            $esAdmin = $i < 5;
            $creadoPor = $esAdmin ? 1 : $usuarioIds[array_rand($usuarioIds)];
            $areaId = $areaIds[$i % count($areaIds)];

            $key = $t['year'] . '-' . $areaId;
            $siguienteNumero[$key] ??= Tramite::where('year', $t['year'])
                ->where('area_id', $areaId)
                ->max('numero_tramite') ?? 0;
            $siguienteNumero[$key]++;

            $tramite = Tramite::create([
                'numero_tramite' => $siguienteNumero[$key],
                'year' => $t['year'],
                'fecha' => $t['fecha'] . ' 08:00:00',
                'descripcion' => $t['descripcion'],
                'numero_diamante' => $t['year'] . '-' . str_pad((string) $siguienteNumero[$key], 4, '0', STR_PAD_LEFT),
                'estado' => $t['estado'],
                'area_id' => $areaId,
                'creado_por' => $creadoPor,
                'derivado_a' => null,
                'ultima_respuesta' => null,
            ]);

            $this->crearDerivaciones($tramite);
        }
    }

    private function crearDerivaciones(Tramite $tramite): void
    {
        $numDerivaciones = random_int(9, 19);

        DerivacionFactory::new()->crearCadena($tramite, $numDerivaciones);

        $ultima = \App\Models\Derivacion::where('tramite_id', $tramite->id)
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
