<?php

namespace App\Services;

use App\Backups\DiscosBackups;
use App\Models\Backup;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Calcula el estado del almacenamiento de backups (panel §16).
 *
 * El cálculo se cachea 60 s y se invalida al crear/borrar un backup.
 */
class BackupEspacioService
{
    public function __construct(
        private readonly BackupProgramacionService $programacion,
        private readonly DiscosBackups $discos,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function datos(): array
    {
        return Cache::remember(
            BackupService::CLAVE_CACHE_ESPACIO,
            60,
            fn (): array => $this->calcular(),
        );
    }

    public function invalidar(): void
    {
        Cache::forget(BackupService::CLAVE_CACHE_ESPACIO);
    }

    /**
     * @return array<string, mixed>
     */
    public function calcular(): array
    {
        $config = $this->programacion->configuracion();

        $disco = $this->discos->disco();
        $ruta = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, rtrim($this->discos->ruta(), '/\\'));

        if (! is_dir($ruta)) {
            @mkdir($ruta, 0755, true);
        }

        $total = @disk_total_space($ruta);
        $libre = @disk_free_space($ruta);
        $disponible = is_float($total) && is_float($libre) && $total > 0;
        $usado = $disponible ? $total - $libre : null;
        $porcentajeDisco = $disponible ? round($usado / $total * 100, 1) : null;

        $completados = Backup::completados()
            ->orderBy('created_at')
            ->orderBy('id')
            ->get(['id', 'nombre', 'tipo', 'tamano_bytes', 'created_at']);

        $totalBytes = (int) $completados->sum('tamano_bytes');
        $cuotaBytes = (int) $config['cuota_mb'] * 1048576;
        $porcentajeCuota = $cuotaBytes > 0 ? round($totalBytes / $cuotaBytes * 100, 2) : null;

        $tamanos = $completados
            ->pluck('tamano_bytes')
            ->filter(fn (?int $bytes): bool => $bytes !== null && $bytes > 0)
            ->map(fn (int $bytes): float => $bytes / 1048576)
            ->values();

        $tendencia = $tamanos->isNotEmpty() ? round((float) $tamanos->avg(), 2) : 0.0;

        $hastaCuota = null;

        if ($cuotaBytes > 0 && $tendencia > 0) {
            $hastaCuota = max(0, (int) floor(($cuotaBytes - $totalBytes) / ($tendencia * 1048576)));
        }

        $huerfanos = $this->huerfanos($disco, $completados);

        $alertas = $this->alertas($config, $disponible, $porcentajeDisco, $porcentajeCuota, $huerfanos);

        return [
            'disco' => [
                'disponible' => $disponible,
                'ruta' => $ruta,
                'total_bytes' => $disponible ? (int) $total : null,
                'usado_bytes' => $usado !== null ? (int) $usado : null,
                'libre_bytes' => $disponible ? (int) $libre : null,
                'porcentaje_usado' => $porcentajeDisco,
            ],
            'backups' => [
                'cantidad' => $completados->count(),
                'total_bytes' => $totalBytes,
                'cuota_bytes' => $cuotaBytes,
                'porcentaje_cuota' => $porcentajeCuota,
                'huerfanos' => count($huerfanos),
                'archivos_huerfanos' => $huerfanos,
                'maximo' => $config['maximo'],
            ],
            'archivos' => $completados
                ->map(fn (Backup $backup): array => [
                    'id' => $backup->id,
                    'nombre' => $backup->nombre,
                    'fecha' => $backup->created_at?->format('Y-m-d'),
                    'tamano_mb' => round(((int) $backup->tamano_bytes) / 1048576, 3),
                    'tipo' => $backup->tipo,
                ])
                ->values()
                ->all(),
            'proyeccion' => [
                'backups_hasta_cuota' => $hastaCuota,
                'tendencia_mb_por_backup' => $tendencia,
            ],
            'alertas' => $alertas,
            'estado' => $this->estado($alertas),
        ];
    }

    /**
     * @param  Filesystem  $disco
     * @param  Collection<int, Backup>  $registrados
     * @return list<string>
     */
    private function huerfanos($disco, $registrados): array
    {
        try {
            $archivos = $disco->files('');
        } catch (\Throwable) {
            return [];
        }

        $rutas = $registrados->pluck('nombre')->all();

        return array_values(array_filter(
            $archivos,
            fn (string $archivo): bool => ! in_array(basename($archivo), $rutas, true),
        ));
    }

    /**
     * @param  array<string, mixed>  $config
     * @param  list<string>  $huerfanos
     * @return list<array{nivel: string, mensaje: string}>
     */
    private function alertas(
        array $config,
        bool $disponible,
        ?float $porcentajeDisco,
        ?float $porcentajeCuota,
        array $huerfanos,
    ): array {
        $alertas = [];
        $alerta = (int) $config['alerta_porcentaje'];

        if (! $disponible) {
            $alertas[] = [
                'nivel' => 'danger',
                'mensaje' => 'No se pudo leer el espacio libre del disco de backups.',
            ];
        } elseif ($porcentajeDisco !== null && $porcentajeDisco >= $alerta) {
            $alertas[] = [
                'nivel' => $porcentajeDisco >= 95 ? 'danger' : 'warning',
                'mensaje' => "El disco está al {$porcentajeDisco}% de uso.",
            ];
        }

        if ($porcentajeCuota !== null && $porcentajeCuota >= $alerta) {
            $alertas[] = [
                'nivel' => $porcentajeCuota >= 100 ? 'danger' : 'warning',
                'mensaje' => "Los backups ocupan el {$porcentajeCuota}% de la cuota configurada.",
            ];
        }

        if ($huerfanos !== []) {
            $alertas[] = [
                'nivel' => 'info',
                'mensaje' => 'Hay '.count($huerfanos).' archivo(s) en la carpeta que no están registrados.',
            ];
        }

        $ultimo = Backup::orderByDesc('id')->first();

        if ($ultimo !== null && $ultimo->estado === Backup::ESTADO_FALLIDO) {
            $alertas[] = [
                'nivel' => 'warning',
                'mensaje' => 'El último backup falló: '.($ultimo->error ?? 'sin detalle'),
            ];
        }

        return $alertas;
    }

    /**
     * @param  list<array{nivel: string}>  $alertas
     */
    private function estado(array $alertas): string
    {
        $niveles = array_column($alertas, 'nivel');

        if (in_array('danger', $niveles, true)) {
            return 'critico';
        }

        if (in_array('warning', $niveles, true)) {
            return 'atencion';
        }

        return 'normal';
    }
}
