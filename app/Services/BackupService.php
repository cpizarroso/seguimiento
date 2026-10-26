<?php

namespace App\Services;

use App\Backups\Contrato\Dumper;
use App\Models\Backup;
use App\Models\BackupEvento;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Generación, retención, protección y borrado de backups.
 *
 * La restauración vive en BackupRestauracionService.
 */
class BackupService
{
    public const CLAVE_CACHE_ESPACIO = 'backups:espacio';

    public const BLOQUEO = 'backups:ejecutando';

    public function __construct(
        private readonly Dumper $dumper,
        private readonly BackupProgramacionService $programacion,
    ) {}

    /**
     * Crea un backup tomando el bloqueo global (para uso desde HTTP/comandos).
     */
    public function crearConBloqueo(
        string $tipo,
        ?int $userId = null,
        ?string $ip = null,
        ?string $nombreOriginal = null,
    ): Backup {
        $lock = Cache::lock(self::BLOQUEO, (int) config('backups.timeout', 3600));

        if (! $lock->get()) {
            throw new RuntimeException('Ya hay un backup en proceso. Intente nuevamente en unos minutos.');
        }

        try {
            return $this->crear($tipo, $userId, $ip, false, $nombreOriginal);
        } finally {
            $lock->release();
        }
    }

    /**
     * Crea un backup. No toma bloqueo: quien invoca debe garantizar exclusión.
     */
    public function crear(
        string $tipo,
        ?int $userId = null,
        ?string $ip = null,
        bool $protegido = false,
        ?string $nombreOriginal = null,
    ): Backup {
        if (function_exists('set_time_limit')) {
            @set_time_limit(0);
        }

        $discoNombre = (string) config('backups.disk');
        $disco = Storage::disk($discoNombre);

        if (! $this->dumper->disponible()) {
            $mensaje = 'No se encontraron los binarios de MySQL. Configure BACKUP_MYSQLDUMP_PATH y BACKUP_MYSQL_PATH.';

            $registro = Backup::create([
                'nombre' => $this->nombreArchivo($tipo),
                'ruta' => '',
                'disco' => $discoNombre,
                'tipo' => $tipo,
                'estado' => Backup::ESTADO_FALLIDO,
                'protegido' => $protegido,
                'user_id' => $userId,
                'error' => $mensaje,
            ]);

            $this->registrarEvento($registro, BackupEvento::ACCION_FALLO, $userId, $ip, $mensaje);
            $this->invalidarEspacio();

            throw new RuntimeException($mensaje);
        }

        $nombre = $this->nombreArchivo($tipo);

        $registro = Backup::create([
            'nombre' => $nombre,
            'ruta' => $nombre,
            'disco' => $discoNombre,
            'tipo' => $tipo,
            'estado' => Backup::ESTADO_EN_PROCESO,
            'protegido' => $protegido,
            'user_id' => $userId,
            'nombre_original' => $nombreOriginal,
        ]);

        $temporal = $this->temporal('sql');

        try {
            $this->dumper->volcar($temporal, $tipo);

            $sql = file_get_contents($temporal);

            if ($sql === false || $sql === '') {
                throw new RuntimeException('El volcado generado está vacío.');
            }

            $comprimido = gzencode($sql, 6);

            if ($comprimido === false) {
                throw new RuntimeException('No se pudo comprimir el volcado.');
            }

            $disco->put($nombre, $comprimido);

            $registro->update([
                'estado' => Backup::ESTADO_COMPLETADO,
                'tamano_bytes' => strlen($comprimido),
                'hash_sha256' => hash('sha256', $comprimido),
                'error' => null,
            ]);

            $this->registrarEvento($registro, BackupEvento::ACCION_CREACION, $userId, $ip, "origen={$tipo}");
            $this->aplicarRetencion();
            $this->invalidarEspacio();

            // La retención puede eliminar este mismo registro si todos los
            // anteriores están protegidos; en ese caso se devuelve el objeto
            // en memoria con sus datos ya calculados.
            return Backup::find($registro->id) ?? $registro;
        } catch (Throwable $e) {
            if ($disco->exists($nombre)) {
                $disco->delete($nombre);
            }

            $registro->update([
                'estado' => Backup::ESTADO_FALLIDO,
                'error' => Str::limit($e->getMessage(), 2000),
            ]);

            $this->registrarEvento(
                Backup::find($registro->id),
                BackupEvento::ACCION_FALLO,
                $userId,
                $ip,
                $e->getMessage(),
                $nombre,
            );
            $this->invalidarEspacio();

            Log::error('backup.fallido', [
                'tipo' => $tipo,
                'mensaje' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            if (is_file($temporal)) {
                @unlink($temporal);
            }
        }
    }

    /**
     * Ejecuta el backup automático si corresponde. Devuelve null si no vencía.
     */
    public function ejecutarSiVencido(): ?Backup
    {
        $config = $this->programacion->configuracion();

        if (! $config['habilitado']) {
            return null;
        }

        if ($config['ultima_ejecucion'] === null) {
            $this->programacion->marcarEjecucion();

            return null;
        }

        if (! $this->programacion->debeEjecutarse($config)) {
            return null;
        }

        $lock = Cache::lock(self::BLOQUEO, (int) config('backups.timeout', 3600));

        if (! $lock->get()) {
            return null;
        }

        try {
            // Revalidar dentro del bloqueo: otro proceso pudo haber ejecutado.
            $config = $this->programacion->configuracion();

            if (! $this->programacion->debeEjecutarse($config)) {
                return null;
            }

            try {
                return $this->crear(Backup::TIPO_AUTOMATICO);
            } catch (Throwable $e) {
                Log::error('backup.automatico.fallido', ['mensaje' => $e->getMessage()]);

                return null;
            } finally {
                $this->programacion->marcarEjecucion();
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Crea el backup previo a una restauración y ajusta la protección acotada.
     */
    public function crearPreRestauracion(?int $userId, ?string $ip = null): Backup
    {
        $backup = $this->crear(Backup::TIPO_PRE_RESTAURACION, $userId, $ip, true);

        $conservar = max(1, (int) config('backups.pre_restauracion_protegidos', 1));

        Backup::where('tipo', Backup::TIPO_PRE_RESTAURACION)
            ->where('protegido', true)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->slice($conservar)
            ->each(fn (Backup $antiguo) => $antiguo->update(['protegido' => false]));

        return $backup;
    }

    /**
     * Archiva un archivo externo validado como backup importado y protegido.
     */
    public function archivarImportado(
        string $sql,
        string $nombreOriginal,
        ?int $userId,
        ?string $ip = null,
    ): Backup {
        $discoNombre = (string) config('backups.disk');
        $disco = Storage::disk($discoNombre);
        $nombre = 'importado-'.now()->format('Ymd-His').'-'.Str::lower(Str::random(8)).'.sql.gz';

        $comprimido = gzencode($sql, 6);

        if ($comprimido === false) {
            throw new RuntimeException('No se pudo comprimir el archivo importado.');
        }

        $disco->put($nombre, $comprimido);

        $registro = Backup::create([
            'nombre' => $nombre,
            'nombre_original' => $this->nombreSeguro($nombreOriginal),
            'ruta' => $nombre,
            'disco' => $discoNombre,
            'tipo' => Backup::TIPO_IMPORTADO,
            'estado' => Backup::ESTADO_COMPLETADO,
            'tamano_bytes' => strlen($comprimido),
            'hash_sha256' => hash('sha256', $comprimido),
            'protegido' => true,
            'user_id' => $userId,
        ]);

        $this->registrarEvento(
            $registro,
            BackupEvento::ACCION_CARGA_EXTERNA,
            $userId,
            $ip,
            sprintf(
                'archivo=%s; bytes=%d; hash=%s',
                $registro->nombre_original,
                strlen($comprimido),
                $registro->hash_sha256,
            ),
        );

        $this->aplicarRetencion();
        $this->invalidarEspacio();

        return $registro;
    }

    /**
     * @return list<string> nombres borrados
     */
    public function aplicarRetencion(): array
    {
        $maximo = $this->programacion->configuracion()['maximo'];
        $excedente = Backup::completados()->count() - $maximo;

        if ($excedente <= 0) {
            return [];
        }

        $borrados = [];

        Backup::completados()
            ->where('protegido', false)
            ->orderBy('created_at')
            ->orderBy('id')
            ->limit($excedente)
            ->get()
            ->each(function (Backup $backup) use (&$borrados): void {
                $nombre = $backup->nombre;
                $this->borrar($backup, 'retención automática');
                $borrados[] = $nombre;
            });

        return $borrados;
    }

    public function borrar(Backup $backup, string $detalle, ?int $userId = null, ?string $ip = null): void
    {
        $nombre = $backup->nombre;

        try {
            Storage::disk($backup->disco)->delete($backup->ruta);
        } catch (Throwable $e) {
            Log::warning('backup.borrado.archivo', [
                'nombre' => $nombre,
                'mensaje' => $e->getMessage(),
            ]);
        }

        $backup->delete();

        // La bitácora sobrevive al registro: backup_id queda null por la FK.
        BackupEvento::create([
            'backup_id' => null,
            'backup_nombre' => $nombre,
            'accion' => BackupEvento::ACCION_ELIMINACION,
            'user_id' => $userId,
            'ip' => $ip,
            'detalle' => $detalle,
        ]);

        $this->invalidarEspacio();
    }

    public function proteger(Backup $backup, bool $protegido): Backup
    {
        $backup->update(['protegido' => $protegido]);

        return $backup->fresh();
    }

    public function registrarEvento(
        ?Backup $backup,
        string $accion,
        ?int $userId,
        ?string $ip,
        ?string $detalle = null,
        ?string $nombreSnapshot = null,
    ): BackupEvento {
        return BackupEvento::create([
            'backup_id' => $backup?->id,
            'backup_nombre' => $nombreSnapshot ?? $backup?->nombre ?? 'desconocido',
            'accion' => $accion,
            'user_id' => $userId,
            'ip' => $ip,
            'detalle' => $detalle === null ? null : Str::limit($detalle, 2000),
        ]);
    }

    public function invalidarEspacio(): void
    {
        Cache::forget(self::CLAVE_CACHE_ESPACIO);
    }

    public function nombreArchivo(string $tipo): string
    {
        $prefijo = (string) config('backups.prefijo', 'backup');
        $slug = (string) config('backups.app_slug', 'seguimiento-adm');
        $sufijo = $tipo === Backup::TIPO_PRE_RESTAURACION ? 'pre-restauracion' : $tipo;
        $base = "{$prefijo}-{$slug}-".now()->format('Ymd-His')."-{$sufijo}";
        $disco = Storage::disk((string) config('backups.disk'));

        $nombre = "{$base}.sql.gz";
        $intento = 1;

        while ($disco->exists($nombre)) {
            $intento++;
            $nombre = "{$base}-{$intento}.sql.gz";
        }

        return $nombre;
    }

    private function temporal(string $prefijo): string
    {
        $directorio = storage_path('framework/tmp');

        if (! is_dir($directorio)) {
            mkdir($directorio, 0700, true);
        }

        $archivo = tempnam($directorio, $prefijo.'-');

        if ($archivo === false) {
            throw new RuntimeException('No se pudo crear un archivo temporal.');
        }

        return $archivo;
    }

    private function nombreSeguro(string $nombre): string
    {
        $limpio = preg_replace('/[\x00-\x1F\x7F]/u', '', basename($nombre)) ?? 'archivo';

        return Str::limit($limpio, 180, '');
    }
}
