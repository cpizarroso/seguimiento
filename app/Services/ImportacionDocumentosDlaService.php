<?php

namespace App\Services;

use App\Models\Area;
use App\Models\ContadorTramite;
use App\Models\Derivacion;
use App\Models\Tramite;
use App\Models\User;
use App\Support\NormalizadorFechaExcel;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use RuntimeException;

/**
 * Importa la planilla "DOCUMENTOS RECIB DLA" (gestión 2026).
 */
class ImportacionDocumentosDlaService
{
    public const HOJA = 'DOCUMENTOS RECIB DLA';

    public const AREA_TRAMITES = 'DLA';

    public const AREA_DESTINO = 'COM';

    public const ANIO = 2026;

    public const FECHA_SIN_DATOS = '2026-01-01 00:00:00';

    /**
     * MySQL no admite 1900-01-01 en columnas TIMESTAMP: se usa el mínimo
     * válido como marca de "no se recuperó la fecha".
     */
    public const FECHA_NO_RECUPERADA = '1970-01-01 00:00:01';

    public function __construct(
        private readonly ContadorTramiteService $contador,
    ) {}

    /**
     * Lee la planilla y devuelve las filas con datos.
     *
     * @return list<array{nro: string, fecha: mixed, descripcion: string, derivado_a: string, rao: string, derivaciones: list<string>}>
     */
    public function leer(string $ruta): array
    {
        if (! is_file($ruta)) {
            throw new RuntimeException("No existe el archivo: {$ruta}");
        }

        $libro = IOFactory::createReaderForFile($ruta)->load($ruta);
        $hoja = $libro->getSheetByName(self::HOJA) ?? $libro->getSheet(0);

        $filas = [];
        $ultima = $hoja->getHighestRow();

        for ($fila = 2; $fila <= $ultima; $fila++) {
            $nro = trim((string) $hoja->getCell("A{$fila}")->getValue());

            if ($nro === '') {
                continue;
            }

            $filas[] = [
                'nro' => $nro,
                'fecha' => $hoja->getCell("B{$fila}")->getValue(),
                'descripcion' => trim((string) $hoja->getCell("C{$fila}")->getValue()),
                'derivado_a' => trim((string) $hoja->getCell("D{$fila}")->getValue()),
                'rao' => trim((string) $hoja->getCell("E{$fila}")->getValue()),
                'derivaciones' => array_values(array_filter(
                    array_map(
                        fn (string $columna) => trim((string) $hoja->getCell("{$columna}{$fila}")->getValue()),
                        ['F', 'G', 'H', 'I'],
                    ),
                    fn (string $texto) => $texto !== '',
                )),
            ];
        }

        return $filas;
    }

    /**
     * Completa las fechas ilegibles usando la fecha del registro vecino.
     *
     * @param  list<array<string, mixed>>  $filas
     * @return list<array<string, mixed>>
     */
    public function normalizarFechas(array $filas): array
    {
        $fechas = [];

        foreach ($filas as $indice => $fila) {
            $fechas[$indice] = NormalizadorFechaExcel::desdeCelda($fila['fecha']);
        }

        foreach ($filas as $indice => $fila) {
            if ($fechas[$indice] !== null) {
                continue;
            }

            $fechas[$indice] = $this->inferirFecha(
                (string) $fila['fecha'],
                $this->vecina($fechas, $indice, -1),
                $this->vecina($fechas, $indice, 1),
            );
        }

        foreach ($filas as $indice => $fila) {
            $filas[$indice]['fecha_normalizada'] = $fechas[$indice];
        }

        return $filas;
    }

    /**
     * @param  list<Carbon|null>  $fechas
     */
    private function vecina(array $fechas, int $indice, int $paso): ?Carbon
    {
        $posicion = $indice + $paso;

        while (array_key_exists($posicion, $fechas)) {
            if ($fechas[$posicion] !== null) {
                return $fechas[$posicion];
            }

            $posicion += $paso;
        }

        return null;
    }

    /**
     * Intenta reconstruir una fecha ilegible: primero con los candidatos
     * válidos y, si no hay, completando día/mes con la fila vecina.
     */
    private function inferirFecha(string $texto, ?Carbon $anterior, ?Carbon $siguiente): ?Carbon
    {
        $referencia = $anterior ?? $siguiente;
        $candidatos = NormalizadorFechaExcel::candidatosDesdeTexto($texto);

        if ($candidatos !== []) {
            if ($referencia === null) {
                return $candidatos[0];
            }

            usort(
                $candidatos,
                fn (Carbon $a, Carbon $b) => abs($a->diffInDays($referencia)) <=> abs($b->diffInDays($referencia)),
            );

            return $candidatos[0];
        }

        if ($referencia === null) {
            return null;
        }

        preg_match_all('/\d+/', $texto, $coincidencias);
        $dia = (int) ($coincidencias[0][0] ?? 0);

        if ($dia < 1 || $dia > 31) {
            $dia = (int) $referencia->day;
        }

        return Carbon::create(self::ANIO, (int) $referencia->month, $dia)->startOfDay();
    }

    /**
     * Ejecuta la importación completa.
     *
     * @return array<string, mixed>
     */
    public function importar(string $ruta, bool $simular = false, bool $forzar = false): array
    {
        $filas = $this->normalizarFechas($this->leer($ruta));
        $areaTramites = $this->area(self::AREA_TRAMITES);
        $this->area(self::AREA_DESTINO); // Valida que Comunicaciones exista.
        $usuario = $this->usuarioImportacion();

        $this->validarImportacionPrevia($areaTramites, $simular, $forzar);
        $this->prepararContador($areaTramites, $filas);

        $reporte = [
            'tramites' => 0,
            'derivaciones' => 0,
            'duplicados' => 0,
            'sin_datos' => 0,
        ];

        $vistos = [];

        foreach ($filas as $fila) {
            $reporte = $this->importarFila($fila, $areaTramites, $usuario, $reporte, $vistos, $simular);
        }

        return $reporte;
    }

    /**
     * Evita duplicar la importación si ya hay trámites de DLA en la gestión.
     */
    private function validarImportacionPrevia(Area $area, bool $simular, bool $forzar): void
    {
        if ($simular || $forzar) {
            return;
        }

        $existentes = Tramite::where('area_id', $area->id)
            ->where('year', self::ANIO)
            ->count();

        if ($existentes > 0) {
            throw new RuntimeException(
                "Ya existen {$existentes} trámites de {$area->codigo} en ".self::ANIO
                .'. Usa --forzar solo si sabes que la importación anterior quedó incompleta.'
            );
        }
    }

    private function area(string $codigo): Area
    {
        $area = Area::where('codigo', $codigo)->first();

        if ($area === null) {
            throw new RuntimeException(
                "No existe el área {$codigo}. Ejecuta AreaSeeder antes de importar."
            );
        }

        return $area;
    }

    private function usuarioImportacion(): User
    {
        $email = 'importacion@'.config('app.user_domain');

        $usuario = User::where('email', $email)->first();

        if ($usuario === null) {
            throw new RuntimeException(
                "No existe el usuario {$email}. Ejecuta UsuarioSeeder antes de importar."
            );
        }

        return $usuario;
    }

    /**
     * Deja el contador en el número más alto de la planilla para que los
     * duplicados y los "S/N" continúen la numeración sin colisionar.
     *
     * @param  list<array<string, mixed>>  $filas
     */
    private function prepararContador(Area $area, array $filas): void
    {
        $maximo = 0;

        foreach ($filas as $fila) {
            if (ctype_digit($fila['nro'])) {
                $maximo = max($maximo, (int) $fila['nro']);
            }
        }

        $contador = ContadorTramite::firstOrCreate(
            ['area_id' => $area->id, 'year' => self::ANIO],
            ['ultimo_numero' => 0],
        );

        if ($contador->ultimo_numero < $maximo) {
            $contador->update(['ultimo_numero' => $maximo]);
        }
    }

    /**
     * @param  array<string, mixed>  $fila
     * @param  array<string, mixed>  $reporte
     * @return array<string, mixed>
     */
    private function importarFila(
        array $fila,
        Area $areaTramites,
        User $usuario,
        array $reporte,
        array &$vistos,
        bool $simular,
    ): array {
        [$numero, $original] = $this->resolverNumero($fila['nro'], $areaTramites, $vistos);

        if ($original !== null) {
            $reporte['duplicados']++;
        }

        $fecha = $fila['fecha_normalizada'];
        $descripcion = $fila['descripcion'] !== '' ? $fila['descripcion'] : 'sin datos';

        if ($fila['descripcion'] === '') {
            $fecha = Carbon::parse(self::FECHA_SIN_DATOS);
            $reporte['sin_datos']++;
        }

        if ($fila['rao'] !== '') {
            $descripcion .= "\nRAO-91: {$fila['rao']}";
        }

        $derivaciones = $this->derivacionesDeFila($fila, $fecha);
        $estado = $this->estadoFinal($derivaciones);

        $reporte['tramites']++;
        $reporte['derivaciones'] += count($derivaciones);

        if ($simular) {
            return $reporte;
        }

        DB::transaction(function () use ($numero, $areaTramites, $fecha, $descripcion, $original, $estado, $derivaciones, $usuario): void {
            $tramite = Tramite::withoutEvents(fn () => Tramite::create([
                'numero_tramite' => $numero,
                'numero_completo' => Tramite::generarNumeroCompleto(
                    $areaTramites->id,
                    $numero,
                    self::ANIO,
                    $areaTramites->codigo,
                ),
                'year' => self::ANIO,
                'fecha' => $fecha,
                'descripcion' => $descripcion,
                'numero_diamante' => $original,
                'estado' => $estado,
                'urgente' => false,
                'area_id' => $areaTramites->id,
                'creado_por' => $usuario->id,
                'derivado_a' => $derivaciones === [] ? null : $usuario->id,
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]));

            $this->crearDerivaciones($tramite, $derivaciones, $usuario);
        });

        return $reporte;
    }

    /**
     * Devuelve el n�mero de tr�mite y el NRO original cuando hubo que
     * renumerar (duplicados o "S/N").
     *
     * @return array{0: int, 1: ?string}
     */
    private function resolverNumero(string $nro, Area $area, array &$vistos): array
    {
        if (! ctype_digit($nro)) {
            return [$this->contador->siguienteNumero($area->id, self::ANIO), $nro];
        }

        $numero = (int) $nro;

        $ocupado = isset($vistos[$numero]) || Tramite::where('area_id', $area->id)
            ->where('year', self::ANIO)
            ->where('numero_tramite', $numero)
            ->exists();

        if (! $ocupado) {
            $vistos[$numero] = true;

            return [$numero, null];
        }

        return [$this->contador->siguienteNumero($area->id, self::ANIO), $nro];
    }

    /**
     * Derivaciones de la fila: "DERIVADO A." primero y luego
     * "DERIVACION 2" .. "DERIVACION 5", conservando el texto completo.
     *
     * @param  array<string, mixed>  $fila
     * @return list<array{texto: string, fecha: ?Carbon}>
     */
    private function derivacionesDeFila(array $fila): array
    {
        $textos = array_merge([(string) $fila['derivado_a']], $fila['derivaciones']);

        $derivaciones = [];

        foreach ($textos as $texto) {
            $texto = trim((string) $texto);

            if ($texto === '') {
                continue;
            }

            $derivaciones[] = [
                'texto' => $texto,
                'fecha' => NormalizadorFechaExcel::fechaEnTexto($texto),
            ];
        }

        return $derivaciones;
    }

    /**
     * @param  list<array{texto: string, fecha: ?Carbon}>  $derivaciones
     */
    private function estadoFinal(array $derivaciones): string
    {
        if ($derivaciones === []) {
            return 'finalizado';
        }

        $ultima = end($derivaciones);

        return $ultima['fecha'] === null ? 'proceso' : 'finalizado';
    }

    /**
     * @param  list<array{texto: string, fecha: ?Carbon}>  $derivaciones
     */
    private function crearDerivaciones(
        Tramite $tramite,
        array $derivaciones,
        User $usuario,
    ): void {
        $numero = 0;

        foreach ($derivaciones as $derivacion) {
            $numero++;

            $fecha = $derivacion['fecha'];

            Derivacion::create([
                'tramite_id' => $tramite->id,
                'numero_derivacion' => $numero,
                'derivado_de' => $usuario->id,
                'derivado_a' => $usuario->id,
                'fecha_derivacion' => $fecha?->copy()->startOfDay() ?? self::FECHA_NO_RECUPERADA,
                'glosa_derivacion' => $derivacion['texto'],
                'fecha_recepcion' => $fecha?->copy()->endOfDay() ?? null,
                'glosa_recepcion' => null,
                'glosa_observacion' => null,
                'estado' => $fecha === null ? 'derivado' : 'recepcionado',
            ]);
        }
    }
}
